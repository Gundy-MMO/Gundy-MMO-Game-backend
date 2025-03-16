
const mongoose = require('mongoose');
 

 
const roomChatSchema = new mongoose.Schema(
  { 
    text: {  
        type: String,
        required: false
    },        
    media: {
      type: String,
      required: false
    },
    mediaLength: {
     type: Number,
      required: false
    },
    mediaName: {
      type: String,
      required: false
    },
    type: {
      type : Number,
      required: true
    },
    sender: {
        type : String,
        required: true
    },
    room: {
      type : String,
      required: true
  },
  },
  { timestamps: true }
);
 

module.exports = mongoose.model('RoomChatModel', roomChatSchema);
