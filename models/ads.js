const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
    {
      imageUrl: String,
      link: String
      },
  { timestamps: true }      
);

module.exports = mongoose.model('adModel', adSchema);
