
const mongoose = require("mongoose");

const state = {
  connected: false
};

async function connect() {
  if (state.connected) return;

  const url = 'mongodb://localhost:27017/shopping'; // Database name included

  try {
    await mongoose.connect(url);
    state.connected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

function get() {
  if (!state.connected || !mongoose.connection.db) {
    throw new Error('Database not connected. Call connect() first.');
  }
  return mongoose.connection.db; // Native MongoDB database object
}

module.exports = {
  connect,
  get
};
