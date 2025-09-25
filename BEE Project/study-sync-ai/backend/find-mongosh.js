#!/usr/bin/env node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for MongoDB Shell (mongosh)...\n');

// Common MongoDB installation paths
const searchPaths = [
  'C:\\Program Files\\MongoDB\\Server\\*\\bin\\mongosh.exe',
  'C:\\Program Files\\MongoDB\\Tools\\*\\bin\\mongosh.exe',
  'C:\\MongoDB\\Server\\*\\bin\\mongosh.exe',
  'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\MongoDB\\*\\bin\\mongosh.exe'
];

function findFiles(pattern) {
  return new Promise((resolve) => {
    exec(`powershell "Get-ChildItem '${pattern}' -ErrorAction SilentlyContinue | Select-Object FullName"`, (error, stdout) => {
      if (stdout && stdout.trim()) {
        resolve(stdout.trim().split('\n').filter(line => line.includes('.exe')));
      } else {
        resolve([]);
      }
    });
  });
}

async function findMongosh() {
  for (const searchPath of searchPaths) {
    console.log(`Searching: ${searchPath}`);
    const files = await findFiles(searchPath);
    
    if (files.length > 0) {
      console.log('✅ Found MongoDB Shell at:');
      files.forEach(file => {
        const cleanPath = file.replace(/^\s*/, '').replace(/\s*$/, '');
        console.log(`   "${cleanPath}"`);
      });
      console.log('\n🚀 To access MongoDB, run:');
      console.log(`   "${files[0].trim()}" mongodb://localhost:27017/study-sync-ai`);
      return;
    }
  }
  
  console.log('❌ MongoDB Shell not found in common locations.');
  console.log('\n💡 Alternative methods:');
  console.log('1. Use our custom script: node mongo-cli.js');
  console.log('2. Install MongoDB Shell: https://www.mongodb.com/try/download/shell');
  console.log('3. Use MongoDB Compass (GUI): https://www.mongodb.com/products/compass');
}

findMongosh();