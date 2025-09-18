// Script to reset admin password
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connection URL for admin database
const url = 'mongodb://localhost:27017/kaarigar_admin';

// Admin details
const admin = {
  phone: '9999999990',
  newPassword: 'password123' // The new password to set
};

async function resetAdminPassword() {
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
    const query = { phone: admin.phone };
    const existingAdmin = await usersCollection.findOne(query);
    
    if (!existingAdmin) {
      console.log('Admin not found with phone:', admin.phone);
      return;
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.newPassword, salt);
    
    // Update the password
    const result = await usersCollection.updateOne(
      query,
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount === 1) {
      console.log('Admin password updated successfully');
      console.log('You can now login with:');
      console.log('Phone:', admin.phone);
      console.log('Password:', admin.newPassword);
    } else {
      console.log('Failed to update admin password');
    }
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Run the password reset
resetAdminPassword(); 