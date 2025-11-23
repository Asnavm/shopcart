const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
   name: {
    type: String
  },

  email: {
    type: String,

    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },

  password: {
    type: String,

    minlength: 6
  }
});
const User= mongoose.model('User', userSchema);

module.exports=User