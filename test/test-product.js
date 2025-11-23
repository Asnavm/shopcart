const db = require('../config/connection');
const productHelper = require('../helpers/product-helpers');

(async () => {
  try {
    await db.connect(); // ✅ Must be awaited
    await productHelper.addProduct({ name: 'Laptop', price: 999 });
    console.log('🎉 Product added successfully');
  } catch (err) {
    console.error('🚨 Error:', err.message);
  }
})();
