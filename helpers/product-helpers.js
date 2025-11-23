
const { response } = require('../app.js');
const db = require('../config/connection');
const Pro=require('../config/schema.js')

module.exports = {
  addProduct: async (product) => {
    try {
      const newProduct = new Pro(product);
      const savedProduct = await newProduct.save();
      console.log('✅ Product added:', savedProduct._id);
      
      return (savedProduct._id);
    } catch (err) {
      console.error('❌ Failed to add product:', err.message);
      throw err;
    }
  },
  getAllProducts: ()=>{
    return new Promise(async(resolve, reject) => {
      try{
      
      let products=await Pro.find()
      resolve(products)}
      catch(err){
        reject(err)
      }
    })
  },
  deleteProduct:(proId)=>{
    return new Promise((resolve, reject) => {
      const deletepro= Pro.deleteOne({_id:proId}).then((response)=>{
      console.log(response);
      
        resolve(response)})
    })
      
  },
  getProductDetails:(proId)=>{
    return new Promise((resolve, reject) => {
      const editpro=Pro.findOne({_id:proId}).then((product)=>
      resolve(product))
    })
  },
  updateProduct:(proId,product)=>{
    return new Promise((resolve, reject) => {
      const updatepro=Pro.updateOne({_id:proId},{
        $set:{
          name:product.name,
          category:product.category,
          price:product.price,
          description:product.description
        }
      }).then(()=>{
        resolve()
      })
    })
  }
    
}
