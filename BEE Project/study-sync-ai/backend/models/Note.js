const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  studyRoom: {
    type: String,
    default: 'default-room'
  },
  aiSummary: {
    content: String,
    provider: String,
    generatedAt: Date
  },
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate metadata before saving
noteSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const words = this.content.split(/\s+/).filter(word => word.length > 0);
    this.metadata.wordCount = words.length;
    this.metadata.readingTime = Math.max(1, Math.ceil(words.length / 200)); // 200 words per minute
  }
  next();
});

// Index for search functionality
noteSchema.index({ 
  title: 'text', 
  content: 'text', 
  tags: 'text' 
});

module.exports = mongoose.model('Note', noteSchema);