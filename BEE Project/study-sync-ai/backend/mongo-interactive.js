#!/usr/bin/env node
const mongoose = require('mongoose');
const readline = require('readline');

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/study-sync-ai';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let db;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    db = mongoose.connection.db;
    console.log('✅ Connected to MongoDB: study-sync-ai');
    console.log('📋 Available commands:');
    console.log('  users       - Show all users');
    console.log('  notes       - Show all notes'); 
    console.log('  collections - List all collections');
    console.log('  databases   - List all databases');
    console.log('  stats       - Show database stats');
    console.log('  clear       - Clear screen');
    console.log('  help        - Show this help');
    console.log('  exit        - Exit CLI\n');
    
    promptUser();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

function promptUser() {
  rl.question('mongodb> ', async (input) => {
    const command = input.trim().toLowerCase();
    
    try {
      switch (command) {
        case 'users':
          const users = await db.collection('users').find({}).toArray();
          console.log(`\n👥 Users (${users.length}):`);
          users.forEach(user => {
            console.log(`  - ${user.username} (${user.email}) - Created: ${new Date(user.createdAt).toLocaleDateString()}`);
          });
          break;
          
        case 'notes':
          const notes = await db.collection('notes').find({}).toArray();
          console.log(`\n📝 Notes (${notes.length}):`);
          if (notes.length === 0) {
            console.log('  No notes found. Create some notes in the app!');
          } else {
            notes.forEach(note => {
              console.log(`  - "${note.title}" by ${note.author} (${note.subject})`);
              console.log(`    Created: ${new Date(note.createdAt).toLocaleDateString()}`);
              console.log(`    Content: ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}`);
            });
          }
          break;
          
        case 'collections':
          const collections = await db.listCollections().toArray();
          console.log(`\n📂 Collections:`);
          for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`  - ${coll.name}: ${count} documents`);
          }
          break;
          
        case 'databases':
          const admin = db.admin();
          const dbs = await admin.listDatabases();
          console.log(`\n🗄️ Databases:`);
          dbs.databases.forEach(database => {
            console.log(`  - ${database.name}: ${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
          });
          break;
          
        case 'stats':
          const stats = await db.stats();
          console.log(`\n📊 Database Stats:`);
          console.log(`  - Database: ${stats.db}`);
          console.log(`  - Collections: ${stats.collections}`);
          console.log(`  - Documents: ${stats.objects}`);
          console.log(`  - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
          console.log(`  - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
          break;
          
        case 'clear':
          console.clear();
          break;
          
        case 'help':
          console.log('\n📋 Available commands:');
          console.log('  users       - Show all users');
          console.log('  notes       - Show all notes'); 
          console.log('  collections - List all collections');
          console.log('  databases   - List all databases');
          console.log('  stats       - Show database stats');
          console.log('  clear       - Clear screen');
          console.log('  help        - Show this help');
          console.log('  exit        - Exit CLI');
          break;
          
        case 'exit':
        case 'quit':
          console.log('👋 Goodbye!');
          await mongoose.connection.close();
          process.exit(0);
          break;
          
        default:
          if (command) {
            console.log(`❌ Unknown command: ${command}`);
            console.log('Type "help" to see available commands.');
          }
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    console.log(''); // Empty line for readability
    promptUser();
  });
}

// Start the CLI
connectDB();