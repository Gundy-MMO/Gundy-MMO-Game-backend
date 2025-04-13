
const mongoose = require('mongoose');
 

 
const airTokchatSchema = new mongoose.Schema(
  { 
    text: {  
        type: String,
        required: false
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
 

module.exports = mongoose.model('AirTokModel', airTokchatSchema);
