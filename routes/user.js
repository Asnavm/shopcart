var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helper');
const { response } = require('../app');
const verifylogin = (req, res, next) => {
  if (req.session.userLoggedIn)
    next()
  else res.redirect('/login')
}
/* GET home page. */
router.get('/',async function (req, res, next) {
  let user = req.session.user
  console.log(user);
  //let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
  }
    productHelper.getAllProducts().then((products) => {
      res.render('user/view-user', {products, user});
    })
});
router.get('/login', (req, res, next) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginerr': req.session.userLoginerr })
    req.session.userLoginerr = false
  }

})
router.get('/signup', (req, res, next) => {
  res.render('user/signup')
})
router.post('/signup', async (req, res) => {

  //try {
  const userId = await userHelper.doSignup(req.body).then((response) => {
    req.session.userLoggedIn = true
    req.session.user = response
    res.redirect('/')
  })
  /* console.log('✅ User signed up with ID:', userId);
   res.render('user/login');
 } catch (err) {
   console.error('❌ Signup failed:', err);
   res.status(500).send('Signup failed');
 }
});*/
})
router.post('/login', (req, res) => {
  console.log(req.body);

  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
    else {
      req.session.userLoginerr = 'Invalid username or password'
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect('/')

})
router.get('/cart', verifylogin, async (req, res) => {
  
   
  let products = await userHelper.getCartProducts(req.session.user._id)
  console.log('products.product', products);

   const isEmpty=products.length==0
   let total=0
  
  if(!isEmpty){
    total=await userHelper.getTotalAmount(req.session.user._id)
   }

  res.render('user/cart', {products,user: req.session.user,total,isEmpty})
})
router.get('/add-to-cart/:id',verifylogin,(req, res) => {
  console.log('api calling');
  
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{ 
   
 userHelper.changeProductQuantity (req.body).then(async(response)=>{
     response.total=await userHelper.getTotalAmount(req.body.user) 
res.json(response)
  })
})
router.post('/remove-product',(req,res,next)=>{
  userHelper.removeProduct(req.body).then((response)=>{
    res.json({status:true})
  })
})
router.get('/place-order',verifylogin,async(req,res)=>{
  let total=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
//  console.log('request recieved:',req.body);
  
  let products=await userHelper.getCartList(req.body.userId)
//  console.log('products are',products);
  
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
//  console.log('total is',totalPrice);
  
  userHelper.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']=='COD'){
 res.json({codSuccess:true})
    }
    else{
      userHelper.generateRazorpay(orderId,totalPrice).then((response)=>{
res.json(response)
      })
    }
   
    //console.log('yor order:',req.body);
  })
  
  
})
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/view-order',async(req,res)=>{
let orders=await userHelper.getUserOrders(req.session.user._id)
res.render('user/view-order',{user:req.session.user,orders})
})
router.get('/view-order-products/:id',async(req,res)=>{
let orderItems=await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,orderItems})
})
router.post('/verify-payment', (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    receipt // optional, if you use it
  } = req.body;

  userHelper.verifyPayment({
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  }).then(() => {
    return userHelper.changePaymentStatus(receipt); // or use `orderId`
  }).then(() => {
    console.log('✅ Payment verified and status updated.');
    res.json({ status: true });
  }).catch((err) => {
    console.error('❌ Payment verification failed:', err);
    res.json({ status: false, errMsg: err.message || 'Verification failed' });
  });
});



module.exports = router;
