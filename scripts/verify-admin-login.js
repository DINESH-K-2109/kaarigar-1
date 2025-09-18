// Test authentication for admin user using MongoDB directly
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL for admin database
const url = 'mongodb://localhost:27017/kaarigar_admin';

// Credentials to test
const credentials = {
  phone: '9999999990',
  password: 'password123' // Replace with the actual password you used
};

async function verifyAdminLogin() {
  let client;
  
  try {
    // Connect to admin database
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to admin database');
    
    // Get the collection
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Try to find user by phone
    const query = { phone: credentials.phone };
    console.log('Searching with query:', JSON.stringify(query));
    
    const user = await usersCollection.findOne(query);
    
    if (user) {
      console.log('Admin user found:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phone);
      console.log('Role:', user.role);
      console.log('Password hash exists:', !!user.password);
      console.log('Password hash:', user.password);
      
      // Test password
      if (user.password) {
        const isValid = await bcrypt.compare(credentials.password, user.password);
        console.log('Password valid:', isValid);
      } else {
        console.log('No password hash found for user');
      }
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error verifying admin login:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Run verification
verifyAdminLogin(); 