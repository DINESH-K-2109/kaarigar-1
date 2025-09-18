require('dotenv').config();
const mongoose = require('mongoose');

async function testSimpleConnection() {
    try {
        // Test with a simple connection string
        const uri = `mongodb+srv://dineshsahu:${process.env.MONGODB_ATLAS_PASSWORD}@kaarigar.u3hd5cp.mongodb.net/kaarigar?retryWrites=true&w=majority`;
        
        const conn = await mongoose.connect(uri);
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('✅ Connection test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing connection:', error);
        process.exit(1);
    }
}

testSimpleConnection(); 