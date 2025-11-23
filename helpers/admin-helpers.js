const { default: mongoose } = require('mongoose');
const { response } = require('../app.js');
const db = require('../config/connection');
const Order=require('../config/schemaOrder.js')
module.exports={
    getorders:()=>{
return new Promise(async (resolve, reject) => {
          
          try {
            let orders = await Order.find()
        
            resolve(orders)
          }
          catch (error) {
            console.log(error);

          }

        })
    },
   changeStatus: async (orderId, status) => {
    console.log('orderid:',orderId);
    console.log('status:',status);
    
    
    return await Order.updateOne(
        { _id: new mongoose.Types.ObjectId(orderId) },
        { $set: { status: status } }
    );
}


}