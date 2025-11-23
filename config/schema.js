const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String,
  description: String,
  image:String
});
const Pro= mongoose.model('Product', productSchema,'products');
module.exports=Pro