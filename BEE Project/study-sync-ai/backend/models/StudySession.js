const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studyRoom: {
    type: String,
    required: true,
    default: 'default-room'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  sessionType: {
    type: String,
    enum: ['pomodoro', 'free-study', 'group-study'],
    default: 'free-study'
  },
  activities: [{
    type: {
      type: String,
      enum: ['note-taking', 'ai-chat', 'quiz', 'summary', 'break'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: Number, // in minutes
    metadata: mongoose.Schema.Types.Mixed
  }],
  notes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  aiInteractions: {
    questionsAsked: {
      type: Number,
      default: 0
    },
    summariesGenerated: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate session duration before saving
studySessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  next();
});

module.exports = mongoose.model('StudySession', studySessionSchema);