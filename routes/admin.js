var express = require('express');
var router = express.Router();
const db = require('../config/connection')
const productHelper = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const adminHelper=require('../helpers/admin-helpers')
const { response } = require('../app');

function verifyAdmin(req, res, next) {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    res.redirect('/admin');
  }
}


/* GET product listing */
router.get('/view-products',verifyAdmin, function (req, res, next) {
 productHelper.getAllProducts().then((products)=>{
//console.log(products);
  res.render('admin/view-products', { admin: true, products });
})
  
});

/* GET add-product page */
router.get('/add-product', function (req, res) {
  res.render('admin/add-product', { admin: true });
});

/* POST add-product */
router.post('/add-product', async (req, res) => {

  console.log(req.body);
  console.log(req.files?.image);
  try {
    console.log('📦 Incoming product:', req.body);
   const id= await productHelper.addProduct(req.body)
      let images = req.files.image
      console.log('your added id is',id);
      images.mv('./public/product-images/' +id+ '.jpg', (err) => {
        if (!err) {
          res.render('admin/add-product', { admin: true });
        }else{
          console.log(err);
           res.status(500).send('Image upload failed');
        }
    })
  }
  catch (err) {
    console.log('error', err);
    res.status(500).send('failed to add product')

  }
});
router.get('/delete-product/:id',(req,res)=>{
 let proId=req.params.id
 console.log(proId);
 productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin')
 })
 
})
router.get('/edit-product/:id',async(req,res)=>{
  
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product);
  
  res.render('admin/edit-product',{product})
})
router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    
res.redirect('/admin')
let id=req.params.id
if(req.files.image){
  let images = req.files.image
      images.mv('./public/product-images/' +id+ '.jpg')
}
  })
})
router.get('/', (req, res, next) => {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/view-products')
  } else {
    res.render('admin/login', { 'loginerr': req.session.adminLoginerr })
    req.session.adminLoginerr = false
  }

})
router.post('/login', (req, res) => {
  console.log(req.body);
const {email,password}=req.body

    if (email==='admin@example.com' && password==='admin') {
      req.session.admin = {email}
      req.session.adminLoggedIn = true
      res.redirect('/admin/view-products')
    }
    else {
      req.session.adminLoginerr = 'Invalid username or password'
      res.redirect('/admin')
    }
})
router.get('/logout', (req, res) => {
  req.session.admin=null
  req.session.adminLoggedIn=false
  res.redirect('/admin')

})
router.get('/all-orders',verifyAdmin,async(req,res)=>{

let orderItems=await adminHelper.getorders()
//console.log('orderItems are:',orderItems);

  res.render('admin/all-orders',{admin:true,orderItems})
})
router.post('/change-status',(req,res)=>{
  adminHelper.changeStatus(req.body.orderId,req.body.status).then(()=>{
    res.json({Success:true})
  })
})
module.exports = router;
