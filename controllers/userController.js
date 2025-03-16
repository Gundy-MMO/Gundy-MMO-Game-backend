const UserModel = require('../models/user');
const jwt = require('jsonwebtoken');
const formidable = require("formidable");
const fs = require("fs");
const AWS = require("aws-sdk");
const user = require('../models/user');


const s3Client = new AWS.S3({
  secretAccessKey: process.env.ACCESS_KEY,
  accessKeyId: process.env.ACCESS_ID,
  region: process.env.region,
});

exports.createUser = async (req, res) => {
  try {
    const { address } = req.body; 
    
    if (!address) {
      return res.status(400).json({ status: false, message: 'Address is required' });
    }
    
    let user = await UserModel.findOne({ address });
  
    if (user) {
      // If user exists, include token in the response
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      return res.status(200).json({ status: true, message: 'User already exists for this address', data: user, token });
    }
  // Dynamically import nanoid
  const { nanoid } = await import('nanoid');
      // Generate a unique username
      const username = nanoid();
  
      // Create new username
      user = new UserModel({ address, username });
      await user.save();
    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({ status: true, message: 'User created successfully', data: user,token});
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: false, message: 'Error creating username', error: error.message });
    }
  };
  exports.updateUser = async (req, res) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 512 * 1024,
      multiples: true,
    });
  
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Error parsing form data -> " + err });
      }
  
      const { username,bio } = fields;
  
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }
  
      try {
        // Check if user exists
        const userId = req.user.userId;
        const user = await UserModel.findById(userId);
        if (!user) {
          return res.status(404).json({ status: false, message: 'User not found' });
        }
  
        // Check for username uniqueness
        const existingUser = await UserModel.findOne({username,_id: { $ne: userId }});
        if (existingUser && existingUser.username===username) {
          return res.status(400).json({ error: "Username already taken" });
        }
  
        // Update user fields
        user.username = username;
        user.bio = bio;
  
        if (files.image) {
          const oldpath = files.image.filepath;
          const fileName = files.image.originalFilename;
  
          fs.readFile(oldpath, async (err, buffer) => {
            if (err) {
              return res.status(500).json({ error: "Error reading file -> " + err });
            }
            const params = {
              Bucket: process.env.IMAGE_BUCKET,
              Key: fileName,
              Body: buffer,
            };
  
            s3Client.upload(params, async (err, s3data) => {
              if (err) {
                return res.status(500).json({ error: "Error uploading file to S3 -> " + err });
              }
  
              try {
                user.image = s3data.Location;
                await user.save();
  
                res.status(200).json({
                  status: true,
                  message: "User updated successfully",
                  data: user,
                });
              } catch (error) {
                res.status(500).json({
                  status: false,
                  message: "Error updating user",
                  error: error.message,
                });
              }
            });
          });
        } else {
          await user.save();
  
          res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: user,
          });
        }
      } catch (error) {
        res.status(500).json({
          status: false,
          message: "Error updating user",
          error: error.message,
        });
      }
    });
  };
  
  

exports.getAllUsers = async (req, res) => {
  try {
    const data = await UserModel.find();
    if (data.length === 0) {
      return res
        .status(404)
        .json({ status: false, message: "No data found" });
    }
    res
      .status(200)
      .json({
        status: true,
        message: "Users fetched successfully",
        data,
      });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        status: false,
        message: "Error fetching usernames",
        error: error.message,
      });
  }
};

exports.getUserByaddress = async (req, res) => {
    try {
      const { address } = req.params;
      const user = await UserModel.findOne({ address });
  
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }
  
      res.status(200).json({ status: true, message: 'User fetched successfully', user });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
    }
  };

  exports.getUserById = async (req, res) => {
    try {
      const userId = req.user.userId;
      const user = await UserModel.findById(userId);
  
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }
  
      res.status(200).json({ status: true, message: 'User fetched successfully', user });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
    }
  };

  exports.getSingleUser = async (req, res) => {
    const _id = req.params.id;
    
    try {
      
      const user = await UserModel.findOne({ _id }); // Corrected the query to use an object with _id
  
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }
  
      res.status(200).json({ status: true, message: 'User fetched successfully', user });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ status: false, message: 'Internal Server Error', error: error.message });
    }
  };
  
  exports.sendFriendRequest = async (req, res) => {
  const {userId : senderId} = req.user ; 
  const {  receiverId } = req.body;
  const sender = await user.findById(senderId);
  const receiver = await user.findById(receiverId);
  if (!sender || !receiver) return res.status(404).json({ message: "User not found" });
  if (receiver.friendRequests.includes(senderId)) return res.status(400).json({ message: "Request already sent" });
  receiver.friendRequests.push(senderId);
  await receiver.save();
  res.json({ message: "Friend request sent" });

};

exports.acceptFriendRequest = async (req, res) => {
  const {userId } = req.user; 
  const {  requesterId } = req.body;
    const _user = await user.findById(userId);
    const requester = await user.findById(requesterId);
    if (!_user || !requester) return res.status(404).json({ message: "User not found" });
    _user.friendRequests = _user.friendRequests.filter(id => id.toString() !== requesterId);
    _user.friends.push(requesterId);
    requester.friends.push(userId);
    await _user.save();
    await requester.save();
    res.json({ message: "Friend request accepted" });
}

exports.rejectFriendRequest = async (req, res) => {
  const {userId} = req.user; 

const {  requesterId } = req.body;
const _user = await user.findById(userId);
if (!_user) return res.status(404).json({ message: "User not found" });
_user.friendRequests = _user.friendRequests.filter(id => id.toString() !== requesterId);
await _user.save();
res.json({ message: "Friend request rejected" });

}

exports.unfriend = async (req, res) => {

const {  friendId } = req.body;
const {userId} = req.user; 
const _user = await user.findById(userId);
const friend = await user.findById(friendId);
if (!_user || !friend) return res.status(404).json({ message: "User not found" });
_user.friends = _user.friends.filter(id => id.toString() !== friendId);
friend.friends = friend.friends.filter(id => id.toString() !== userId);
await _user.save();
await friend.save();
res.json({ message: "Unfriended successfully" });

}

exports.friends = async (req, res) => {

const _user = await user.findById(req.user.userId).populate("friends", "username");
if (!_user) return res.status(404).json({ message: "User not found" });
res.json(_user.friends);

}
exports.pendingFriendRequest = async (req, res) => {

const userRequested = await user.findById(req.user.userId).populate("friendRequests", "username");
if (!userRequested) return res.status(404).json({ message: "User not found" });
res.json(userRequested.friendRequests);

}