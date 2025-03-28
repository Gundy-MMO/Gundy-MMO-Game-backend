const { default: axios } = require("axios");
const jwt = require('jsonwebtoken');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;



const formidable = require('formidable')
const AWS = require('aws-sdk');
const fs = require("fs");

const { ethers } = require('ethers'); 
const { ObjectId } = require("mongodb");
const user = require("../models/user");
const chat = require("../models/chat"); 
const roomChat = require("../models/roomChat");
 
 

const s3Client = new AWS.S3({
    secretAccessKey: process.env.ACCESS_KEY,
    accessKeyId: process.env.ACCESS_ID,
    region: process.env.REGION
})

const uploadParams = {
    Bucket: process.env.DATA_BUCKET,
    Body: null,
};


exports.sendMessage = async (req, res) => {
    try {
        
        let _data = { 
            text: req.body.text,
            sender: req.user.userId,
            receiver: req.body.receiver, 
            type: 1,
          }
    
            const _createMessage = await chat.create(_data);
            if (!_createMessage) {
              res.send({ status: "NOT OK", message: "Message sendind failed"})
              return;
             }
    
            const _getMessages = await chat.find({$or : [
                {sender: req.user.userId ,receiver: req.body.receiver},
                {sender: req.body.receiver,receiver: req.user.userId}
            ]});
            
            res.send({ status: "OK", message: "Message Sent", messages: _getMessages   });
            return ;
        
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}

exports.sendRoomMessage = async (req, res) => {
    try {
        
        let _data = { 
            text: req.body.text,
            sender: req.user.userId,
            room: req.body.room, 
            type: 1,
          }
    
            const _createMessage = await roomChat.create(_data);
            if (!_createMessage) {
              res.send({ status: "NOT OK", message: "Message sendind failed"})
              return;
             }
    
            const _getMessages = await roomChat.find(
                {sender: req.user.userId ,room: req.body.room});
            
            res.send({ status: "OK", message: "Message Sent", messages: _getMessages   });
            return ;
        
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}

exports.getRoomMessage = async (req,res) => {
    try {

            const _getMessages = await roomChat.find(
                {room: req.params.room}
            );
      
            res.send({ status: "OK", message: "Message Found", messages: _getMessages})
            return;

    
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}
exports.getAgoraVoiceToken = (req,res) => {
    try{
        const channelName = req.query.channel;
  if (!channelName) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

//   const uid = req.user.userId;
  const uid = req.query.userId;
  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 24*3600; // 1 hour token expiration
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );

  res.json({  status: true , token  });
    }
    catch(e){
        console.log(e);
  res.json({ status: false });

    }
}
exports.getMessage = async (req,res) => {
    try {

            const _getMessages = await chat.find({$or : [
                {sender: req.user.userId ,receiver: req.params.chatId},
                {sender: req.params.chatId,receiver: req.user.userId}
            ]});
      
            res.send({ status: "OK", message: "Message Found", messages: _getMessages})
            return;

    
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}

exports.getUserChats = async (req,res) => {
    try {
        const userId = req.user.userId;

        // Find unique conversation pairs
        const conv = await chat.find({
                    $or: [{ sender: userId }, { receiver: userId }]
                });
                const conversations = await chat.aggregate([
                    {
                        $match: {
                            $or: [{ sender: userId }, { receiver: userId }]
                        }
                    },
                    {
                        $addFields: {
                            otherUser: {
                                $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"]
                            }
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $group: {
                            _id: "$otherUser",
                            latestMessage: { $first: "$text" },
                            latestMessageTime: { $first: "$createdAt" }
                        }
                    },
                    {
                        $addFields: {
                            otherUserObjectId: { $toObjectId: "$_id" } // Convert string to ObjectId
                        }
                    },
                    {
                        $lookup: {
                            from: "usermodels", // Ensure it matches the actual collection name
                            localField: "otherUserObjectId", // Converted ObjectId
                            foreignField: "_id", // Matching with userModel's ObjectId
                            as: "userDetails"
                        }
                    },
                    {
                        $unwind: {
                            path: "$userDetails",
                            preserveNullAndEmptyArrays: true // Avoid errors if no user found
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            username: "$userDetails.username",
                            chatid: "$userDetails._id",
                            latestMessage: 1,
                            latestMessageTime: 1
                        }
                    },
                    {
                        $sort: { latestMessageTime: -1 }
                    }
                    
                ]);

    res.status(200).json({conversations});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
 
// Utilis

function uploadMedia(req,res){
  const form = new formidable.IncomingForm({
    maxFileSize: 1 * 1024 * 1024 * 1024,
});  
 
form.parse(req, async (err, fields, files) => {
    if (err) {
        return res.status(500).json({ error: "Error -> " + err });
    }

    const _verify = true ; 
 
  
  if(_verify){
    console.log(fields);
    if (files.media) {

        console.log(files.media[0].filepath);
        var oldpath = files.media[0].filepath;
        var fileName = files.media[0].originalFilename;
        let _name = generateRandomString(8) + fileName;
 
        fs.readFile(oldpath, function (err, buffer) {
            if (err) {
                return res.status(500).json({ error: "Error -> " + err });
            }

            const params = uploadParams;
            params.Key = "chatMedia/"+ fields.poolId + "/" + _name;

            params.Body = buffer;
            let _key = "chatMedia/"+ fields.poolId + "/" + _name;
            s3Client.upload(params, async (err, data) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: "Error -> " + err });
                }
                // const s3Link = data.Location;
                console.log(_name);
                let _data = {
                   sender: req.user.userId,
                   receiver: req.body.receiver,
                  text: fields.text[0],
                  media: _key,
                  mediaLength: buffer.byteLength,
                  mediaName: fileName, 
                  type: 2,
                }
                const _createMessage = await chat.create(_data);
                if (!_createMessage) {
                  res.send({ status: "NOT OK", message: "Message sendind failed"})
                  return;
                 }

        const _getMessages = await chat.find();
        
        res.send({ status: "OK", message: "Message Sent", messages: _getMessages });
        return ;
              

            })
        })

    }
    else {
      let _data = { 
        text: fields.text[0],
        sender: req.user.userId,
        reciver: req.body.receiver, 
        type: 1,
      }

        const _createMessage = await chat.create(_data);
        if (!_createMessage) {
          res.send({ status: "NOT OK", message: "Message sendind failed"})
          return;
         }

        const _getMessages = await chat.find({$or : [
            {sender: req.user.userId ,receiver: req.body.receiver},
            {sender: req.body.receiver,receiver: req.user.userId}
        ]});
        
        res.send({ status: "OK", message: "Message Sent", messages: _getMessages   });
        return ;
 

    }
  }
  else{
    res.send({ status: "NOT OK", message: "Not Authorized" })

  }

})
}



function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}
