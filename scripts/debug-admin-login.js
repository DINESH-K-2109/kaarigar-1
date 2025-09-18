// Debug script to test password hashing and comparison
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL for admin database
const url = 'mongodb://localhost:27017/kaarigar_admin';

// Test credentials
const credentials = {
  phone: '9999999990',
  password: 'password123'
};

async function debugAdminLogin() {
  let client;
  
  try {
    // Connect to admin database
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to admin database');
    
    // Get the collection
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find admin by phone
    const query = { phone: credentials.phone };
    console.log('\nSearching for admin with query:', query);
    
    const user = await usersCollection.findOne(query);
    
    if (user) {
      console.log('\nAdmin user found:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Phone:', user.phone);
      console.log('Role:', user.role);
      
      // Test password hash
      console.log('\nPassword debug:');
      console.log('Stored hash:', user.password);
      
      // Create a new hash with the same password for comparison
      const salt = await bcrypt.genSalt(10);
      const testHash = await bcrypt.hash(credentials.password, salt);
      console.log('Test hash:', testHash);
      
      // Compare password directly
      const isValid = await bcrypt.compare(credentials.password, user.password);
      console.log('\nPassword comparison:');
      console.log('Input password:', credentials.password);
      console.log('Is valid:', isValid);
      
      // Try comparing with a known working hash
      const knownHash = '$2a$10$1JqT.xi6HxkR.Qh0CBmN5OGdSR4PKd6pQQ/V6jQ6HUT/YWjW.W1zS'; // hash for 'password123'
      const testValidation = await bcrypt.compare(credentials.password, knownHash);
      console.log('\nTest validation with known hash:');
      console.log('Is valid with known hash:', testValidation);
      
      // Create a new hash and immediately verify it
      const newHash = await bcrypt.hash(credentials.password, 10);
      const newValidation = await bcrypt.compare(credentials.password, newHash);
      console.log('\nFresh hash test:');
      console.log('New hash:', newHash);
      console.log('Validates correctly:', newValidation);
      
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error debugging admin login:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run debug
debugAdminLogin(); 