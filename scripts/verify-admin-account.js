// Script to verify admin account existence
const { MongoClient } = require('mongodb');

// Connection URL for admin database
const url = 'mongodb://localhost:27017/kaarigar_admin';

// Admin phone to check
const adminPhone = '9999999900';

async function verifyAdminAccount() {
  let client;
  
  try {
    // Connect to admin database
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to admin database');
    
    // Get the collection
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Try to find admin by phone
    const query = { phone: adminPhone };
    console.log('\nSearching for admin with query:', query);
    
    const user = await usersCollection.findOne(query);
    
    if (user) {
      console.log('\nAdmin user found:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phone);
      console.log('Role:', user.role);
    } else {
      console.log('\nNo admin user found with this phone number');
    }
    
  } catch (error) {
    console.error('Error verifying admin account:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run verification
verifyAdminAccount(); 