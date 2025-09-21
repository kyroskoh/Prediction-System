const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  moderators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  currentPrediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    maxPredictionsPerUser: {
      type: Number,
      default: 1
    },
    allowEditAfterClose: {
      type: Boolean,
      default: false
    },
    autoCloseAfter: {
      type: Number, // minutes
      default: null
    }
  },
  stats: {
    totalPredictions: {
      type: Number,
      default: 0
    },
    totalUsers: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
channelSchema.index({ name: 1 });
channelSchema.index({ owner: 1 });
channelSchema.index({ 'admins.user': 1 });
channelSchema.index({ 'moderators.user': 1 });
channelSchema.index({ isActive: 1 });

// Check if user has admin privileges
channelSchema.methods.isAdmin = function(userId) {
  return this.admins.some(admin => admin.user.toString() === userId.toString());
};

// Check if user has moderator privileges
channelSchema.methods.isModerator = function(userId) {
  return this.moderators.some(mod => mod.user.toString() === userId.toString());
};

// Check if user is owner
channelSchema.methods.isOwner = function(userId) {
  return this.owner.toString() === userId.toString();
};

// Check if user has any elevated privileges
channelSchema.methods.hasPermission = function(userId) {
  return this.isOwner(userId) || this.isAdmin(userId) || this.isModerator(userId);
};

module.exports = mongoose.model('Channel', channelSchema);