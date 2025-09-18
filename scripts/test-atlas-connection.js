require('dotenv').config();
const mongoose = require('mongoose');

async function testConnections() {
    try {
        const password = process.env.MONGODB_ATLAS_PASSWORD;
        
        // Test main database
        const mainConn = await mongoose.createConnection(`mongodb+srv://dineshsahu:${password}@kaarigar.u3hd5cp.mongodb.net/kaarigar?retryWrites=true&w=majority`).asPromise();
        console.log('✅ Successfully connected to main database');
        const mainCollections = await mainConn.db.listCollections().toArray();
        console.log('Main database collections:', mainCollections.map(c => c.name));
        
        // Test admin database
        const adminConn = await mongoose.createConnection(`mongodb+srv://dineshsahu:${password}@kaarigar.u3hd5cp.mongodb.net/kaarigar_admin?retryWrites=true&w=majority`).asPromise();
        console.log('✅ Successfully connected to admin database');
        const adminCollections = await adminConn.db.listCollections().toArray();
        console.log('Admin database collections:', adminCollections.map(c => c.name));
        
        // Test customers database
        const customersConn = await mongoose.createConnection(`mongodb+srv://dineshsahu:${password}@kaarigar.u3hd5cp.mongodb.net/kaarigar_customers?retryWrites=true&w=majority`).asPromise();
        console.log('✅ Successfully connected to customers database');
        const customerCollections = await customersConn.db.listCollections().toArray();
        console.log('Customers database collections:', customerCollections.map(c => c.name));
        
        // Test tradesmen database
        const tradesmenConn = await mongoose.createConnection(`mongodb+srv://dineshsahu:${password}@kaarigar.u3hd5cp.mongodb.net/kaarigar_tradesmen?retryWrites=true&w=majority`).asPromise();
        console.log('✅ Successfully connected to tradesmen database');
        const tradesmenCollections = await tradesmenConn.db.listCollections().toArray();
        console.log('Tradesmen database collections:', tradesmenCollections.map(c => c.name));

        // Close all connections
        await Promise.all([
            mainConn.close(),
            adminConn.close(),
            customersConn.close(),
            tradesmenConn.close()
        ]);
        
        console.log('\n✅ All database connections tested successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error testing connections:', error);
        process.exit(1);
    }
}

testConnections(); 