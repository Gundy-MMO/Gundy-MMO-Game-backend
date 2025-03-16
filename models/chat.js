
const mongoose = require('mongoose');
 

 
const chatSchema = new mongoose.Schema(
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
    receiver: {
      type : String,
      required: true
  },
  },
  { timestamps: true }
);
 

module.exports = mongoose.model('ChatModel', chatSchema);
