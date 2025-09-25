#!/usr/bin/env node
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/study-sync-ai';

async function showDatabaseStructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('🗄️  DATABASE: study-sync-ai');
    console.log('=' .repeat(50));
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collName = collection.name;
      const count = await db.collection(collName).countDocuments();
      
      console.log(`\n📁 TABLE: ${collName.toUpperCase()}`);
      console.log('-'.repeat(30));
      console.log(`📊 Total Records: ${count}`);
      
      if (count > 0) {
        // Get sample documents to show structure
        const samples = await db.collection(collName).find({}).limit(3).toArray();
        
        console.log('📝 Sample Data:');
        samples.forEach((doc, index) => {
          console.log(`\n   Record ${index + 1}:`);
          
          // Pretty print the document
          const formatted = JSON.stringify(doc, null, 4);
          const lines = formatted.split('\n');
          
          lines.forEach(line => {
            console.log(`   ${line}`);
          });
          
          if (index < samples.length - 1) {
            console.log('   ' + '.'.repeat(25));
          }
        });
        
        // Show field structure
        console.log('\n🏗️  Field Structure:');
        const firstDoc = samples[0];
        Object.keys(firstDoc).forEach(field => {
          const value = firstDoc[field];
          const type = Array.isArray(value) ? 'Array' : typeof value === 'object' && value !== null ? 'Object' : typeof value;
          console.log(`   • ${field}: ${type}`);
        });
        
      } else {
        console.log('   (Empty - No records yet)');
      }
      
      console.log('\n' + '='.repeat(50));
    }
    
    // Database statistics
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('-'.repeat(25));
    
    const stats = await db.stats();
    console.log(`• Database Name: ${stats.db}`);
    console.log(`• Collections: ${stats.collections}`);
    console.log(`• Total Documents: ${stats.objects}`);
    console.log(`• Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`• Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Show all databases
    console.log('\n🏛️  ALL DATABASES ON THIS SERVER:');
    console.log('-'.repeat(35));
    
    const admin = db.admin();
    const dbs = await admin.listDatabases();
    
    dbs.databases.forEach(database => {
      const isCurrentDB = database.name === 'study-sync-ai';
      const marker = isCurrentDB ? '👉 ' : '   ';
      console.log(`${marker}${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database exploration completed!');
  }
}

// Run the database explorer
showDatabaseStructure();