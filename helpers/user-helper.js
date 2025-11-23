const { default: mongoose } = require('mongoose');
const { response } = require('../app.js');
const db = require('../config/connection');
const User = require('../config/schema1.js');
const Cart = require('../config/schema2.js')
const Pro = require('../config/schema.js')
const Order = require('../config/schemaOrder.js')
const bcrypt = require('bcrypt');
const { count } = require('mongodb/lib/operations/cursor_ops.js');
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: 'rzp_test_REDi8Sc9YckzWd',
  key_secret: '0NG4CUjGrZQf9uY4riys6Cpt',
});
//const ObjectId=new mongoose.Types.ObjectId
module.exports = {
  doSignup: async (userData) => {
    try {

      userData.password = await bcrypt.hash(userData.password, 10)
      const newUser = new User(userData);
      const savedUser = await newUser.save();


      console.log('✅ user added:', savedUser._id);


      return (savedUser._id);
    }
    catch (error) {
      console.error('❌ Error during signup:', error);
      throw error;
    }
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginstatus = false
      let response = {}
      const users = await User.findOne({ email: userData.email })
      if (users) {
        bcrypt.compare(userData.password, users.password).then((status) => {
          if (status) {
            console.log('login success');
            response.user = users
            response.status = true
            resolve(response)

          } else {
            console.log('login failed');
            resolve({ status: false })

          }
        })

      } else {
        console.log('login failed email not found');
        resolve({ status: false })

      }
    })
  },
  addToCart: async (proId, userId) => {
    const proObj = {
      item: new mongoose.Types.ObjectId(proId),
      quantity: 1,
    };

    try {
      const userCart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });

      if (userCart) {
        const proExistIndex = userCart.cartproducts.findIndex(product =>
          product.item.toString() === proId
        );

        if (proExistIndex !== -1) {
          // Product exists, increment quantity
          const response = await Cart.updateOne(
            { user: new mongoose.Types.ObjectId(userId), 'cartproducts.item': new mongoose.Types.ObjectId(proId) },
            { $inc: { 'cartproducts.$.quantity': 1 } }
          );
          return response;
        } else {
          // Product doesn't exist, push new item
          const response = await Cart.updateOne(
            { user: new mongoose.Types.ObjectId(userId) },
            { $push: { cartproducts: proObj } }
          );
          return response;
        }
      } else {
        // No cart exists, create new cart
        const newCart = new Cart({
          user: new mongoose.Types.ObjectId(userId),
          cartproducts: [proObj],
        });
        const response = await newCart.save();
        return response;
      }
    } catch (error) {
      throw error;
    }
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      const cart = await Cart.findOne({ user: userId });

      let cartItems = await Cart.aggregate([
        {
          $match: { user: new mongoose.Types.ObjectId(userId) }
        }, {
          $unwind: '$cartproducts'
        }, {
          $project: {
            item: '$cartproducts.item',
            quantity: '$cartproducts.quantity'
          }
        }, {
          $lookup: {
            from: 'products',
            localField: 'item',
            foreignField: '_id',
            as: 'product'
          }
        },{
          $unwind:'$product'
        }

      ]).exec()
      //console.log(cartItems[0].products);

      resolve(cartItems)
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userObjid = new mongoose.Types.ObjectId(userId);
        let count = 0;
        let cart = await Cart.findOne({ user: userObjid });


        if (cart) {
          count = cart.cartproducts.length;
          console.log('cart product count is:', count);
        }

        resolve(count); // Always resolve, even if cart is null
      } catch (error) {
        console.error('Error in getCartCount:', error);
        reject(error); // Handle unexpected errors
      }
    });
  }, changeProductQuantity: (details) => {
    return new Promise(async (resolve, reject) => {
      if(details.count==-1 && details.quantity==1)
{
await Cart.updateOne(
        { _id: new mongoose.Types.ObjectId(details.cart), 'cartproducts.item': new mongoose.Types.ObjectId(product) },
        { $pull: { cartproducts:{item:new mongoose.Types.ObjectId(details.product)} } }
      ).then((response) => {
        resolve({ removeProduct: true })

})
} 


        else{
      await Cart.updateOne(
        { _id: new mongoose.Types.ObjectId(details.cart), 'cartproducts.item': new mongoose.Types.ObjectId(product) },
        { $inc: { 'cartproducts.$.quantity': count } }
      ).then((response) => {
        resolve({ status: true })
      })}
    })
  },
  removeProduct: ({ cart, product }) => {
    return new Promise(async (resolve, reject) => {
      await Cart.updateOne(
        { _id: new mongoose.Types.ObjectId(cart), 'cartproducts.item': new mongoose.Types.ObjectId(product) }, {
        $pull: { cartproducts: { item: new mongoose.Types.ObjectId(product) } }
      }

      ).then((response) => {
        resolve(response)
      })

    })
  },
  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {

      const userCart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });

      if (userCart) {
        //if(userCart.cartproducts.map(p => p.quantity)> 0) {

        let total = await Cart.aggregate([
          {
            $match: { user: new mongoose.Types.ObjectId(userId) }
          }, {
            $unwind: '$cartproducts'
          }, {
            $project: {
              item: '$cartproducts.item',
              quantity: '$cartproducts.quantity'
            }
          }, {
            $lookup: {
              from: 'products',
              localField: 'item',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $project: {
              item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: { $multiply: ['$quantity', '$product.price'] }

              }
            }
          }

        ]).exec()
        totalAmount = total[0].total
        console.log(total[0].total);
      }
    
// /
  
      resolve(totalAmount)
    })


},
  placeOrder: (details, products, total) => {
    return new Promise((resolve, reject) => {
      //console.log('products ***',details,products,total);

      let status = details.paymentMethod === 'cod' ? 'placed' : 'pending'
      let orderObj = {
        deliveryDetails: {
          name: details.name,
          mobile: details.number,
          address: details.address,
          zip: details.zip

        },
        user: new mongoose.Types.ObjectId(details.userId),
        paymentMethod: details.paymentMethod,
        products: products,
        totalPrice: total,
        status: status

      }
      const newOrder = new Order(orderObj);

      newOrder.save()
        .then((response) => {
          savedOrder=response

          return Cart.deleteOne({ user: new mongoose.Types.ObjectId(details.userId) })
        }).then(() => {
          resolve(savedOrder._id);
        }
        )



    })
      .catch((err) => {
        reject(err)


      })

  },
    getCartList: (userId) => {
      return new Promise(async (resolve, reject) => {
        let cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) })
        resolve(cart.cartproducts)
      })
    },
      getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
          console.log(userId);
          try {
            let orders = await Order.find({ user: new mongoose.Types.ObjectId(userId) })
            console.log(orders);
            resolve(orders)
          }
          catch (error) {
            console.log(error);

          }

        })
      },
      getOrderProducts:(orderId)=>{
        return new Promise(async(resolve, reject) => {
          let orderItems=await Order.aggregate([
            {
              $match:{_id:new mongoose.Types.ObjectId(orderId)}
            },
            {
              $unwind:
              '$products'
              
            },{
            $project:{
              item:'$products.item',
              quantity:'$products.quantity'}
            },{
            $lookup:{
              from:'products',
              localField:'item',
              foreignField:'_id',
              as:'product'
            }
          },
          {
            $project:{
              item:1,quantity:1,product: { $arrayElemAt: ['$product', 0] }
            }
          },
          
          ]).exec()
console.log('orderItems',orderItems);
resolve(orderItems)

        })
      },
      generateRazorpay:(orderId,total)=>{
        return new Promise((resolve, reject) => {
        var options={
          amount: total,
currency: "INR",
receipt: orderId

        }

instance.orders.create(options, function(err,order) {
  console.log('new order',order);
  resolve(order)
  
}

)
        })

      },
      verifyPayment: ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
  return new Promise((resolve, reject) => {
    const crypto = require('crypto');
    const secret = '0NG4CUjGrZQf9uY4riys6Cpt'

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_payment_id}|${razorpay_order_id}`)
      .digest('hex');
console.log('🧪 Signing String:', `${razorpay_payment_id}|${razorpay_order_id}`);

    console.log('Generated Signature:', hmac);
    console.log('Received Signature:', razorpay_signature);

    if (hmac === razorpay_signature) {
      resolve();
    } else {
      reject(new Error('Signature mismatch'));
    }
  });
},


      changePaymentStatus:(orderId)=>{
        return new Promise((resolve, reject) => {
          Order.updateOne({_id:new mongoose.Types.ObjectId(orderId)},{
            $set:{
              status:'placed'
            }
          }).then(()=>{
            resolve()
          })
        })
      }





}

