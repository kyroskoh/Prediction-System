const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Channel = require('../models/Channel');
const Prediction = require('../models/Prediction');

// Import middleware
const { predictionLimiter, adminLimiter } = require('../middleware/rateLimiter');

// Helper function to get or create legacy user
async function getOrCreateUser(username) {
  let user = await User.findOne({ username: username.toLowerCase() });
  
  if (!user) {
    user = new User({
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@legacy.local`,
      password: 'legacy-temp-' + Math.random().toString(36),
      role: 'user'
    });
    await user.save();
  }
  
  return user;
}

// Helper function to get or create channel
async function getOrCreateChannel(channelName) {
  let channel = await Channel.findOne({ name: channelName.toLowerCase() });
  
  if (!channel) {
    // Create owner user for the channel
    const owner = await getOrCreateUser(channelName);
    owner.role = 'owner';
    await owner.save();
    
    channel = new Channel({
      name: channelName.toLowerCase(),
      displayName: channelName,
      owner: owner._id
    });
    await channel.save();
  }
  
  return channel;
}

// Helper function to get current prediction for channel
async function getCurrentPrediction(channel) {
  if (channel.currentPrediction) {
    return await Prediction.findById(channel.currentPrediction);
  }
  return null;
}

// Helper function to send legacy response
function sendLegacyResponse(res, message) {
  res.status(200).send(message);
}

// Legacy validation function (same as original)
function isValidPredictionFormat(prediction, maxScore = 13) {
  const parts = prediction.split('-');
  if (parts.length !== 2) return false;
  
  const leftNum = parseInt(parts[0]);
  const rightNum = parseInt(parts[1]);
  
  if (isNaN(leftNum) || isNaN(rightNum)) return false;
  
  if ((leftNum === maxScore && rightNum >= 0 && rightNum <= maxScore) ||
      (rightNum === maxScore && leftNum >= 0 && leftNum <= maxScore)) {
    return true;
  }
  
  return false;
}

// Route: Check health (backward compatibility)
router.get('/', (req, res) => {
  sendLegacyResponse(res, 'I am alive!');
});

// Route: Open prediction
router.get('/:channel/open', adminLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const channel = await getOrCreateChannel(channelName);
    
    // Close any existing prediction
    if (channel.currentPrediction) {
      const currentPrediction = await getCurrentPrediction(channel);
      if (currentPrediction && currentPrediction.status === 'open') {
        currentPrediction.status = 'cancelled';
        await currentPrediction.save();
      }
    }
    
    // Create new prediction
    const owner = await User.findById(channel.owner);
    const newPrediction = new Prediction({
      channel: channel._id,
      title: 'Prediction Session',
      openedBy: owner._id,
      status: 'open'
    });
    
    await newPrediction.save();
    
    // Update channel
    channel.currentPrediction = newPrediction._id;
    await channel.save();
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelName}`).emit('prediction-opened', {
        channel: channelName,
        predictionId: newPrediction._id
      });
    }
    
    sendLegacyResponse(res, 'New Prediction is now opened, and all previous predictions have been cleared!');
  } catch (error) {
    console.error('Error opening prediction:', error);
    sendLegacyResponse(res, 'Error opening prediction. Please try again.');
  }
});

// Route: Add prediction
router.get('/:channel/add', predictionLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const username = req.query.username;
    const predictionValue = req.query.prediction;
    
    if (!username || !predictionValue) {
      sendLegacyResponse(res, 'Please provide username and prediction with format: xx-xx. Example: !addpredict 13-9');
      return;
    }
    
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    if (!prediction) {
      sendLegacyResponse(res, 'No active prediction session. Please wait for one to be opened.');
      return;
    }
    
    if (prediction.status !== 'open') {
      sendLegacyResponse(res, 'Predictions have been closed!');
      return;
    }
    
    if (!isValidPredictionFormat(predictionValue, prediction.maxScore)) {
      sendLegacyResponse(res, `Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in ${prediction.maxScore}.`);
      return;
    }
    
    // Check if user already has a prediction
    const existingEntry = prediction.entries.find(entry => entry.username === username.toLowerCase());
    if (existingEntry) {
      sendLegacyResponse(res, `${username}: You have already submitted your prediction: ${existingEntry.prediction}`);
      return;
    }
    
    // Add prediction
    const user = await getOrCreateUser(username);
    await prediction.addEntry(user, username, predictionValue);
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelName}`).emit('prediction-added', {
        channel: channelName,
        username,
        prediction: predictionValue
      });
    }
    
    sendLegacyResponse(res, `Prediction added successfully for ${username}. Your prediction: ${predictionValue}`);
  } catch (error) {
    console.error('Error adding prediction:', error);
    sendLegacyResponse(res, 'Error adding prediction. Please try again.');
  }
});

// Route: Close prediction
router.get('/:channel/close', adminLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    if (!prediction) {
      sendLegacyResponse(res, 'No active prediction to close.');
      return;
    }
    
    if (prediction.status !== 'open') {
      sendLegacyResponse(res, 'Prediction is already closed.');
      return;
    }
    
    prediction.status = 'closed';
    prediction.closedAt = new Date();
    await prediction.save();
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelName}`).emit('prediction-closed', {
        channel: channelName,
        predictionId: prediction._id
      });
    }
    
    sendLegacyResponse(res, 'Predictions have been closed!');
  } catch (error) {
    console.error('Error closing prediction:', error);
    sendLegacyResponse(res, 'Error closing prediction. Please try again.');
  }
});

// Route: List predictions
router.get('/:channel/list', async (req, res) => {
  try {
    const channelName = req.params.channel;
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    if (!prediction || prediction.entries.length === 0) {
      sendLegacyResponse(res, `Predictions are empty for channel, ${channelName}.`);
      return;
    }
    
    const predictionList = prediction.entries.map(entry => `${entry.username}: ${entry.prediction}`).join(', ');
    sendLegacyResponse(res, `[Current Predictions] ${predictionList}`);
  } catch (error) {
    console.error('Error listing predictions:', error);
    sendLegacyResponse(res, 'Error retrieving predictions.');
  }
});

// Route: Check status
router.get('/:channel/status', async (req, res) => {
  try {
    const channelName = req.params.channel;
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    const statusMessage = (prediction && prediction.status === 'open')
      ? 'Predictions are currently open.'
      : 'Predictions are currently closed.';
    
    sendLegacyResponse(res, statusMessage);
  } catch (error) {
    console.error('Error checking status:', error);
    sendLegacyResponse(res, 'Error checking prediction status.');
  }
});

// Route: Edit prediction
router.get('/:channel/edit', predictionLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const username = req.query.username;
    const newPrediction = req.query.prediction;
    
    if (!username || !newPrediction) {
      sendLegacyResponse(res, 'Please provide username and prediction.');
      return;
    }
    
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    if (!prediction) {
      sendLegacyResponse(res, 'No active prediction session.');
      return;
    }
    
    if (prediction.status !== 'open') {
      sendLegacyResponse(res, `${username}: Predictions are closed. You cannot edit predictions.`);
      return;
    }
    
    if (!isValidPredictionFormat(newPrediction, prediction.maxScore)) {
      sendLegacyResponse(res, `Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in ${prediction.maxScore}.`);
      return;
    }
    
    // Find existing entry
    const entryIndex = prediction.entries.findIndex(entry => entry.username === username.toLowerCase());
    if (entryIndex === -1) {
      sendLegacyResponse(res, `Prediction for ${username} is not found.`);
      return;
    }
    
    // Update prediction
    prediction.entries[entryIndex].prediction = newPrediction;
    prediction.entries[entryIndex].editedAt = new Date();
    await prediction.save();
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelName}`).emit('prediction-edited', {
        channel: channelName,
        username,
        prediction: newPrediction
      });
    }
    
    sendLegacyResponse(res, `Prediction edited successfully for ${username}. New prediction: ${newPrediction}`);
  } catch (error) {
    console.error('Error editing prediction:', error);
    sendLegacyResponse(res, 'Error editing prediction. Please try again.');
  }
});

// Route: Set result
router.get('/:channel/result', adminLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const actualResult = req.query.result;
    
    if (!actualResult) {
      sendLegacyResponse(res, 'Please provide the actual result.');
      return;
    }
    
    const channel = await getOrCreateChannel(channelName);
    const prediction = await getCurrentPrediction(channel);
    
    if (!prediction) {
      sendLegacyResponse(res, 'No prediction to resolve.');
      return;
    }
    
    if (prediction.status === 'open') {
      sendLegacyResponse(res, 'Predictions are still open. Results will be available after closing predictions.');
      return;
    }
    
    const owner = await User.findById(channel.owner);
    await prediction.resolveWith(actualResult, owner._id);
    
    const winners = prediction.getWinners();
    
    // Emit WebSocket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel:${channelName}`).emit('prediction-resolved', {
        channel: channelName,
        result: actualResult,
        winners: winners.map(w => w.username)
      });
    }
    
    if (winners.length > 0) {
      const winnerUsernames = winners.map(winner => winner.username).join(', ');
      sendLegacyResponse(res, `[Prediction Result] Winners: ${winnerUsernames}. Actual Result: ${actualResult}`);
    } else {
      sendLegacyResponse(res, `[Prediction Result] No winners. Actual Result: ${actualResult}`);
    }
  } catch (error) {
    console.error('Error setting result:', error);
    sendLegacyResponse(res, 'Error setting prediction result.');
  }
});

// Admin routes
router.get('/:channel/admin/addAdmin', adminLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const adminUsername = req.query.username?.replace('@', '').toLowerCase();
    
    if (!adminUsername) {
      sendLegacyResponse(res, 'Please provide a username.');
      return;
    }
    
    const channel = await getOrCreateChannel(channelName);
    const adminUser = await getOrCreateUser(adminUsername);
    
    // Check if already admin
    if (channel.isAdmin(adminUser._id)) {
      sendLegacyResponse(res, `Admin ${adminUsername} is already in ${channelName}'s Prediction System!`);
      return;
    }
    
    // Add admin
    channel.admins.push({
      user: adminUser._id,
      addedBy: channel.owner
    });
    await channel.save();
    
    sendLegacyResponse(res, `Admin ${adminUsername} added successfully into ${channelName}'s Prediction System!`);
  } catch (error) {
    console.error('Error adding admin:', error);
    sendLegacyResponse(res, 'Error adding admin.');
  }
});

router.get('/:channel/admin/removeAdmin', adminLimiter, async (req, res) => {
  try {
    const channelName = req.params.channel;
    const adminUsername = req.query.username?.replace('@', '').toLowerCase();
    
    if (!adminUsername) {
      sendLegacyResponse(res, 'Please provide a username.');
      return;
    }
    
    const channel = await getOrCreateChannel(channelName);
    const adminUser = await User.findOne({ username: adminUsername });
    
    if (!adminUser || !channel.isAdmin(adminUser._id)) {
      sendLegacyResponse(res, `Admin ${adminUsername} is not in ${channelName}'s Prediction System!`);
      return;
    }
    
    // Remove admin
    channel.admins = channel.admins.filter(admin => !admin.user.equals(adminUser._id));
    await channel.save();
    
    sendLegacyResponse(res, `Admin ${adminUsername} removed successfully into ${channelName}'s Prediction System!.`);
  } catch (error) {
    console.error('Error removing admin:', error);
    sendLegacyResponse(res, 'Error removing admin.');
  }
});

router.get('/:channel/admin/list', async (req, res) => {
  try {
    const channelName = req.params.channel;
    const channel = await getOrCreateChannel(channelName);
    
    // Populate admin users
    await channel.populate('admins.user', 'username');
    
    const adminList = channel.admins.map(admin => admin.user.username);
    
    if (adminList.length === 0) {
      sendLegacyResponse(res, `${channelName}'s Prediction Admins: None`);
    } else {
      sendLegacyResponse(res, `${channelName}'s Prediction Admins: ${adminList.join(', ')}`);
    }
  } catch (error) {
    console.error('Error listing admins:', error);
    sendLegacyResponse(res, 'Error retrieving admin list.');
  }
});

module.exports = router;
