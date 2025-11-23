const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cartproducts: [{item:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product'},quantity:Number }]
});


const Cart=mongoose.model('Cart',cartSchema)
module.exports=Cart
