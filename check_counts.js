
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://127.0.0.1:27017/SpareWorkProd';

async function checkCounts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      isSeller: Boolean,
      isVerified: Boolean
    }));
    
    const count = await User.countDocuments({ isSeller: true, isVerified: true });
    console.log('Total verified sellers:', count);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCounts();
