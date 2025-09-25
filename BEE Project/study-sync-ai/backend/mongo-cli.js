#!/usr/bin/env node
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/study-sync-ai';

async function connectAndExplore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // List all databases
    console.log('\n📋 Available Databases:');
    const dbs = await admin.listDatabases();
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List collections in our database
    console.log(`\n📂 Collections in 'study-sync-ai' database:`);
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('  No collections found. Database is empty.');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name} (${count} documents)`);
      }
    }
    
    // Show some sample commands
    console.log('\n🔧 Sample MongoDB Commands:');
    console.log('  To connect: mongosh mongodb://localhost:27017/study-sync-ai');
    console.log('  To show databases: show dbs');
    console.log('  To use our database: use study-sync-ai');
    console.log('  To show collections: show collections');
    console.log('  To find users: db.users.find()');
    console.log('  To find notes: db.notes.find()');
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.log('\n💡 Possible solutions:');
    console.log('  1. Make sure MongoDB service is running');
    console.log('  2. Check if MongoDB is installed properly');
    console.log('  3. Try installing MongoDB Community Edition');
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connection closed.');
  }
}

connectAndExplore();