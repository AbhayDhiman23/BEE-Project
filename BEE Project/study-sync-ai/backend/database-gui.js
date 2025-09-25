#!/usr/bin/env node
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3001;
const MONGODB_URI = 'mongodb://localhost:27017/study-sync-ai';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create views directory and template
const fs = require('fs');
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
  fs.mkdirSync(viewsDir);
}

// Create EJS template
const ejsTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>MongoDB Database Viewer - Study Sync AI</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header { 
            background: #2c3e50; 
            color: white; 
            padding: 20px; 
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.8; }
        .stats { 
            display: flex; 
            justify-content: space-around; 
            background: #34495e; 
            color: white; 
            padding: 15px;
        }
        .stat-item { text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; display: block; }
        .stat-label { font-size: 0.9em; opacity: 0.8; }
        .collection { 
            margin: 20px; 
            border: 2px solid #ecf0f1; 
            border-radius: 8px;
            overflow: hidden;
        }
        .collection-header { 
            background: #3498db; 
            color: white; 
            padding: 15px; 
            font-size: 1.2em; 
            font-weight: bold;
        }
        .collection-body { padding: 20px; }
        .document { 
            background: #f8f9fa; 
            border: 1px solid #dee2e6; 
            border-radius: 5px; 
            margin: 10px 0; 
            padding: 15px;
        }
        .document-header { 
            font-weight: bold; 
            color: #2c3e50; 
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        .field { 
            margin: 8px 0; 
            display: flex; 
            align-items: flex-start;
        }
        .field-name { 
            font-weight: bold; 
            color: #e74c3c; 
            min-width: 150px; 
            margin-right: 10px;
        }
        .field-value { 
            flex: 1; 
            word-break: break-all;
            background: white;
            padding: 5px;
            border-radius: 3px;
        }
        .empty-collection { 
            text-align: center; 
            color: #7f8c8d; 
            font-style: italic; 
            padding: 40px;
        }
        .refresh-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .refresh-btn:hover { background: #c0392b; }
        .json-data { 
            background: #2c3e50; 
            color: #ecf0f1; 
            padding: 10px; 
            border-radius: 4px; 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh</button>
    
    <div class="container">
        <div class="header">
            <h1>📊 MongoDB Database Viewer</h1>
            <p>Study Sync AI - Real-time Database Explorer</p>
        </div>
        
        <div class="stats">
            <div class="stat-item">
                <span class="stat-number"><%= stats.collections %></span>
                <span class="stat-label">Collections</span>
            </div>
            <div class="stat-item">
                <span class="stat-number"><%= stats.objects %></span>
                <span class="stat-label">Documents</span>
            </div>
            <div class="stat-item">
                <span class="stat-number"><%= (stats.dataSize / 1024 / 1024).toFixed(2) %></span>
                <span class="stat-label">MB Data</span>
            </div>
            <div class="stat-item">
                <span class="stat-number"><%= new Date().toLocaleTimeString() %></span>
                <span class="stat-label">Last Updated</span>
            </div>
        </div>
        
        <% collections.forEach(function(collection) { %>
        <div class="collection">
            <div class="collection-header">
                📁 <%= collection.name.toUpperCase() %> 
                (<%= collection.documents.length %> documents)
            </div>
            <div class="collection-body">
                <% if (collection.documents.length === 0) { %>
                    <div class="empty-collection">
                        📭 No documents found in this collection
                    </div>
                <% } else { %>
                    <% collection.documents.forEach(function(doc, index) { %>
                    <div class="document">
                        <div class="document-header">
                            🗂️ Document #<%= index + 1 %> (ID: <%= doc._id %>)
                        </div>
                        <% Object.keys(doc).forEach(function(key) { %>
                            <% if (key !== '_id') { %>
                            <div class="field">
                                <div class="field-name"><%= key %>:</div>
                                <div class="field-value">
                                    <% if (typeof doc[key] === 'object' && doc[key] !== null) { %>
                                        <div class="json-data"><%= JSON.stringify(doc[key], null, 2) %></div>
                                    <% } else { %>
                                        <%= doc[key] %>
                                    <% } %>
                                </div>
                            </div>
                            <% } %>
                        <% }); %>
                    </div>
                    <% }); %>
                <% } %>
            </div>
        </div>
        <% }); %>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(viewsDir, 'database.ejs'), ejsTemplate);

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

app.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // Get database stats
    const stats = await db.stats();
    
    // Get all collections with their documents
    const collectionsInfo = await db.listCollections().toArray();
    const collections = [];
    
    for (const collectionInfo of collectionsInfo) {
      const collectionName = collectionInfo.name;
      const documents = await db.collection(collectionName).find({}).toArray();
      
      collections.push({
        name: collectionName,
        documents: documents
      });
    }
    
    res.render('database', { stats, collections });
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 MongoDB GUI Viewer is running!
📱 Open your browser and go to: http://localhost:${PORT}
🔄 The page will show real-time database content
💡 Refresh the page to see latest data
`);
});