const fetch = require('node-fetch');
const { createParser } = require('eventsource-parser');
const airTokChat = require('../models/airTokChat');

exports.streamChatRequest = async (userId,userPrompt) => {
  const response = await fetch('https://app.airtok.ai/api/v1/npc/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.AIRTOK_API_KEY
    },
    body: JSON.stringify({
      groupId: userId,
      userPrompt: userPrompt,
      userId: userId
    })
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // console.log(response)

  const parser = createParser({
    onEvent(event) {   
        const data = event.data;
        console.log(data);
    }
  });

  response.body.on('data', chunk => {
    console.log(chunk.toString())
    parser.feed(chunk.toString());
  });

  response.body.on('end', () => {
    console.log('Stream closed');
  });

  response.body.on('error', err => {
    console.error('Stream error:', err);
  });
}

exports.chatRequest = async (userId,userPrompt) => {
  const response = await fetch('https://app.airtok.ai/api/v1/npc/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.AIRTOK_API_KEY
    },
    body: JSON.stringify({
      groupId: userId,
      userPrompt: userPrompt,
      userId: userId
    })
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const _r = await response.json();
  // console.log(_r.response)
  return _r.response
 
}


exports.sendAirTokMessage = async (req, res) => {
    try {
        
        let _data = { 
            text: req.body.text,
            sender: req.user.userId,
            receiver: 'airtok'
          }
    
            const _createMessage = await airTokChat.create(_data);
            if (!_createMessage) {
              res.send({ status: "NOT OK", message: "Message sendind failed"})
              return;
             }

            const airtokResponce = await this.chatRequest(req.user.userId,req.body.text)
            let _airtokdata = { 
              text: airtokResponce,
              sender: 'airtok',
              receiver: req.user.userId
            }
      
              const _createAirtokMessage = await airTokChat.create(_airtokdata);
              if (!_createAirtokMessage) {
                res.send({ status: "NOT OK", message: "Airtok API Error"})
                return;
               }
    
             const _getMessages = await airTokChat.find(
              {
              $or: [
                  {sender: req.user.userId},
                  {receiver: req.user.userId}
              ]
              }
          );
            
            res.send({ status: "OK", message: "Message Sent", messages: _getMessages   });
            return ;
        
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}
exports.getAirTokMessage = async (req,res) => {
    try {

            const _getMessages = await airTokChat.find(
                {
                $or: [
                    {sender: req.user.userId},
                    {receiver: req.user.userId}
                ]
                }
            );

            
      
            res.send({ status: "OK", message: "Message Found", messages: _getMessages})
            return;

    
    }
    catch (e) {
        console.log(e);
        res.send({ status: "NOT OK", message: "Runtime error" })

    }
}