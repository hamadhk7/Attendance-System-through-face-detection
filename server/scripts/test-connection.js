require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    console.log('Connection String:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('Database Name:', mongoose.connection.db.databaseName);
    console.log('Connection State:', mongoose.connection.readyState);
    
    // Test creating a simple document
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Test document created successfully!');
    
    await testCollection.deleteOne({ test: true });
    console.log('✅ Test document deleted successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.name === 'MongoNetworkError') {
      console.log('💡 Possible solutions:');
      console.log('   - Check your internet connection');
      console.log('   - Verify MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
      console.log('   - Ensure your cluster is running');
    }
    
    if (error.name === 'MongoParseError') {
      console.log('💡 Check your connection string format');
    }
    
    if (error.message.includes('authentication')) {
      console.log('💡 Check your username and password');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Connection closed.');
    process.exit(0);
  }
}

testConnection();