const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  deliveryDetails:{name:String,
    mobile:Number,
    address:String,
    zip:Number
                    
  },
  user:{type: mongoose.Schema.Types.ObjectId},
  paymentMethod:String,
  products:[{
    item:String,
    quantity:Number
  }],
  totalPrice:Number,
  status:String,
  date:{
    type:Date,
    default:Date.now
  }
});
const Order= mongoose.model('Order', orderSchema);
module.exports=Order