const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017/kaarigar';

async function clearChats() {
  let client;
  
  try {
    // Connect to the database
    client = new MongoClient(url);
    await client.connect();
    console.log('Connected to the database');
    
    // Get the database
    const db = client.db();
    
    // Delete all messages first
    const messagesResult = await db.collection('messages').deleteMany({});
    console.log(`Deleted ${messagesResult.deletedCount} messages`);
    
    // Then delete all conversations
    const conversationsResult = await db.collection('conversations').deleteMany({});
    console.log(`Deleted ${conversationsResult.deletedCount} conversations`);
    
    console.log('All chats have been cleared successfully');
  } catch (error) {
    console.error('Error clearing chats:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Run the script
clearChats(); 