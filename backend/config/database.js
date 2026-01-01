const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      console.log('💡 Please set MONGODB_URI in your Render environment variables');
      return;
    }

    // Connection options for better reliability on cloud platforms
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    
    // More specific error messages
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Network error: Check your MongoDB Atlas connection string');
      console.error('💡 Ensure your IP is whitelisted in MongoDB Atlas Network Access');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Authentication failed: Check your MongoDB username and password');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Connection timeout: Check your network connection and MongoDB Atlas status');
    }
    
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 To fix: Verify MONGODB_URI in Render environment variables');
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
