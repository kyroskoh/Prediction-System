const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Prediction Session'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'resolved', 'cancelled'],
    default: 'open'
  },
  gameType: {
    type: String,
    enum: ['cs2', 'valorant', 'other'],
    default: 'cs2'
  },
  maxScore: {
    type: Number,
    default: 13,
    min: 1,
    max: 50
  },
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  actualResult: {
    type: String,
    trim: true
  },
  entries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    prediction: {
      type: String,
      required: true,
      trim: true
    },
    isWinner: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    editedAt: {
      type: Date
    }
  }],
  stats: {
    totalEntries: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    winners: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
predictionSchema.index({ channel: 1, status: 1 });
predictionSchema.index({ 'entries.user': 1 });
predictionSchema.index({ 'entries.username': 1 });
predictionSchema.index({ openedAt: -1 });
predictionSchema.index({ status: 1 });

// Validation for prediction format
predictionSchema.path('entries').schema.path('prediction').validate(function(value) {
  return isValidPredictionFormat(value, this.parent().maxScore || 13);
}, 'Invalid prediction format');

// Helper function to validate prediction format
function isValidPredictionFormat(prediction, maxScore = 13) {
  const parts = prediction.split('-');
  if (parts.length !== 2) return false;
  
  const leftNum = parseInt(parts[0]);
  const rightNum = parseInt(parts[1]);
  
  // Check if numbers are valid
  if (isNaN(leftNum) || isNaN(rightNum)) return false;
  
  // Check if one side is maxScore and other is valid
  if ((leftNum === maxScore && rightNum >= 0 && rightNum <= maxScore) ||
      (rightNum === maxScore && leftNum >= 0 && leftNum <= maxScore)) {
    return true;
  }
  
  return false;
}

// Instance methods
predictionSchema.methods.addEntry = function(user, username, predictionValue) {
  // Check if user already has an entry
  const existingEntryIndex = this.entries.findIndex(
    entry => entry.user.toString() === user._id.toString()
  );
  
  if (existingEntryIndex !== -1) {
    // Update existing entry
    this.entries[existingEntryIndex].prediction = predictionValue;
    this.entries[existingEntryIndex].editedAt = new Date();
  } else {
    // Add new entry
    this.entries.push({
      user: user._id,
      username: username,
      prediction: predictionValue
    });
    this.stats.totalEntries++;
  }
  
  // Update unique users count
  const uniqueUsers = new Set(this.entries.map(entry => entry.user.toString()));
  this.stats.uniqueUsers = uniqueUsers.size;
  
  return this.save();
};

predictionSchema.methods.resolveWith = function(actualResult, resolvedBy) {
  this.actualResult = actualResult;
  this.status = 'resolved';
  this.resolvedBy = resolvedBy;
  this.resolvedAt = new Date();
  
  // Mark winners
  let winnerCount = 0;
  this.entries.forEach(entry => {
    if (entry.prediction === actualResult) {
      entry.isWinner = true;
      winnerCount++;
    }
  });
  
  this.stats.winners = winnerCount;
  return this.save();
};

predictionSchema.methods.getWinners = function() {
  return this.entries.filter(entry => entry.isWinner);
};

predictionSchema.methods.isOpen = function() {
  return this.status === 'open';
};

predictionSchema.methods.isClosed = function() {
  return this.status === 'closed';
};

predictionSchema.statics.isValidPredictionFormat = isValidPredictionFormat;

module.exports = mongoose.model('Prediction', predictionSchema);