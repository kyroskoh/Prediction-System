const express = require('express');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');

// Configure bodyParser to parse JSON data
app.use(bodyParser.json());

// Define your prediction-related data structures
let predictions = [];
let config; // Declare the config object

// Function to load predictions from a local JSON file
function loadPredictionsFromFile(channelName) {
  const filename = `predictions_${channelName}.json`;
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create an empty array
    return [];
  }
}

// Function to load the open/close status from a config file
function loadConfigFile(channelName) {
  const filename = `config_${channelName}.json`;
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create an initial config with isPredictionOpen set to false
    const initialConfig = { isPredictionOpen: false };
    fs.writeFileSync(filename, JSON.stringify(initialConfig, null, 2), 'utf8');
    return initialConfig;
  }
}

// Function to save the open/close status to a config file
function saveConfigFile(channelName, config) {
  const filename = `config_${channelName}.json`;
  fs.writeFileSync(filename, JSON.stringify(config, null, 2), 'utf8');
}

// Function to load admins from a local JSON file
function loadAdminsFromFile(channelName) {
  const filename = `admins_${channelName}.json`;
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist or there is an error, log the error and return an empty array
    console.error(`Error loading admins from file: ${error.message}`);
    return [];
  }
}

// Function to save admins to a JSON file
function saveAdminsFile(channelName, admins) {
  const filename = `admins_${channelName}.json`;
  fs.writeFileSync(filename, JSON.stringify(admins, null, 2), 'utf8');
}

// Load initial data from predictions.json, config.json, and admins.json files
app.param('channel', (req, res, next, channelName) => {
  predictions = loadPredictionsFromFile(channelName);
  config = loadConfigFile(channelName); // Update config here
  admins = loadAdminsFromFile(channelName); // Load admins here
  let isPredictionOpen = config.isPredictionOpen;
  next();
});

// Middleware to check if prediction is open
function checkPredictionOpen(req, res, next) {
  if (config.isPredictionOpen) {
    next();
  } else {
    res.status(200).send('Predictions have been closed!');
  }
}

// Middleware to check if prediction is closed
function checkPredictionClosed(req, res, next) {
  if (!config.isPredictionOpen) {
    next();
  } else {
    res.status(200).send('Predictions are still open. You can add or edit predictions.');
  }
}

// Check healthcheck (GET method)
app.get('/', (req, res) => {
  res.status(200).send('I am alive!');
});

// Open a new prediction (GET method)
app.get('/prediction/:channel/open', (req, res) => {
  const channelName = req.params.channel;
  config.isPredictionOpen = true;
  predictions = []; // Clear the predictions array
  // Update the status in the config file
  saveConfigFile(channelName, config);
  // Save the empty array to the predictions file
  fs.writeFileSync(`predictions_${channelName}.json`, '[]', 'utf8');
  res.status(200).send('New Prediction is now opened, and all previous predictions have been cleared!');
});

// Close the current prediction (GET method)
app.get('/prediction/:channel/close', (req, res) => {
  const channelName = req.params.channel;
  config.isPredictionOpen = false;
  // Update the status in the config file
  saveConfigFile(channelName, config);
  res.status(200).send('Predictions have been closed!');
});

// Function to validate the prediction format
function isValidPredictionFormat(prediction) {
  const parts = prediction.split('-');
  if (parts.length !== 2) return false;
  const leftNum = parseInt(parts[0]);
  const rightNum = parseInt(parts[1]);

  if (
    (leftNum === 13 && rightNum >= 0 && rightNum <= 13) ||
    (rightNum === 13 && leftNum >= 0 && leftNum <= 13)
  ) {
    return true;
  }

  return false;
}

// Function to handle adding a prediction
function handleAddPrediction(channelName, username, prediction, res) {
  // Check if prediction is empty
  if (!prediction || prediction == null || prediction == undefined) {
    res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !addpredict 13-9`);
    return;
  }

  if (isValidPredictionFormat(prediction)) {
    // Check if the user has already submitted a prediction
    const existingPrediction = predictions.find((item) => item.username === username);
    if (existingPrediction) {
      res.status(200).send(`You have already submitted your prediction: ${existingPrediction.prediction}`);
    } else {
      predictions.push({ username, prediction });

      // Save the predictions to a local JSON file
      fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

      res.status(200).send(`Prediction added successfully for ${username}. Your prediction: ${prediction}`);
    }
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
}

// Function to handle editing a prediction
function handleEditPrediction(channelName, username, newPrediction, res) {
  if (isValidPredictionFormat(newPrediction)) {
    if (!config.isPredictionOpen) {
      res.status(200).send('Predictions are closed. You cannot edit predictions.');
    } else {
      const predictionIndex = predictions.findIndex((item) => item.username === username);
      if (predictionIndex !== -1) {
        predictions[predictionIndex].prediction = newPrediction;

        // Update the local JSON file
        fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

        res.status(200).send(`Prediction edited successfully for ${username}. New prediction: ${newPrediction}`);
      } else {
        res.status(200).send(`Prediction for ${username} is not found.`);
      }
    }
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
}

// Function to handle listing all predictions
function handleListPredictions(res) {
  const predictionList = predictions.map((item) => `${item.username}: ${item.prediction}`).join(', ');
  res.status(200).send(`[Current Predictions] ${predictionList}`);
}

// Function to handle opening a prediction
function handleOpenPrediction(channelName, res, req) {
  const reqChannel = req.query.channel;
  const reqUsername = req.query.username;

  if (channelName === reqChannel && reqChannel === reqUsername) {
    config.isPredictionOpen = true;
    predictions = []; // Clear the predictions array
    // Update the status in the config file
    saveConfigFile(channelName, config);
    // Save the empty array to the predictions file
    fs.writeFileSync(`predictions_${channelName}.json`, '[]', 'utf8');
    res.status(200).send('New Prediction is now opened, and all previous predictions have been cleared!');
  } else {
    res.status(200).send('Access denied. Both channel name and username must match.');
  }
}

// Function to handle closing a prediction
function handleClosePrediction(channelName, res, req) {
  const reqChannel = req.query.channel;
  const reqUsername = req.query.username;

  if (channelName === reqChannel && reqChannel === reqUsername) {
    config.isPredictionOpen = false;
    // Update the status in the config file
    saveConfigFile(channelName, config);
    res.status(200).send('Predictions have been closed!');
  } else {
    res.status(200).send('Access denied. Both channel name and username must match.');
  }
}

// Function to handle adding a prediction by owner
function handleAddByOwner(channelName, ownerUsername, targetUsername, prediction, res, req) {
  const reqChannel = req.query.channel;

  // Check if the owner is allowed to add predictions for others
  if (channelName === reqChannel && ownerUsername === channelName) {
    // Check if prediction is empty
    if (!prediction || prediction == null || prediction == undefined) {
      res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !addpredict 13-9`);
      return;
    }

    if (isValidPredictionFormat(prediction)) {
      const targetUserPrediction = { username: targetUsername, prediction };
      predictions.push(targetUserPrediction);

      // Save the predictions to a local JSON file
      fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

      res.status(200).send(`Prediction added successfully for ${targetUsername} by ${ownerUsername}. Prediction: ${prediction}`);
    } else {
      res.status(200).send(`Prediction format is invalid for ${targetUsername}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
    }
  } else {
    res.status(200).send('Access denied. Owner must match the channel name, and the owner must be the channel owner.');
  }
}

// Function to handle prediction result
function handlePredictionResult(channelName, actualResult, res) {
  // Check if predictions are closed
  if (!config.isPredictionOpen) {
    // Calculate the winners
    const winners = predictions.filter((item) => item.prediction === actualResult);

    if (winners.length > 0) {
      const winnerUsernames = winners.map((winner) => winner.username).join(', ');
      res.status(200).send(`[Prediction Result] Winners: ${winnerUsernames}. Actual Result: ${actualResult}`);
    } else {
      res.status(200).send(`[Prediction Result] No winners. Actual Result: ${actualResult}`);
    }
  } else {
    res.status(200).send('Predictions are still open. Results will be available after closing predictions.');
  }
}

// Route to handle prediction commands
app.get('/prediction/:channel/predict', checkPredictionClosed, (req, res) => {
  const channelName = req.params.channel;
  const command = req.query.command;

  switch (command) {
    case 'add':
    case 'edit':
      const username = req.query.username;
      const prediction = req.query.prediction;
      if (command === 'add') {
        handleAddPrediction(channelName, username, prediction, res);
      } else {
        const newPrediction = req.query.prediction;
        handleEditPrediction(channelName, username, newPrediction, res);
      }
      break;

    case 'list':
    case 'status':
      if (command === 'list') {
        handleListPredictions(res);
      } else {
        const statusMessage = config.isPredictionOpen
          ? 'Predictions are currently open.'
          : 'Predictions are currently closed.';
        res.status(200).send(statusMessage);
      }
      break;

    // case 'open':
    //   handleOpenPrediction(channelName, res, req);
    //   break;

    // case 'close':
    //   handleClosePrediction(channelName, res, req);
    //   break;

    case 'result':
      if (channelName === req.query.channel) {
        const actualResult = req.query.actualResult;
        handlePredictionResult(channelName, actualResult, res);
      } else {
        res.status(200).send('Access denied. Only the channel owner can perform this action.');
      }
      break;

    // case 'fadd':
    //   const ownerUsername = req.query.username;
    //   const targetUsername = req.query.toUsername; // Updated parameter for the target username
    //   const ownerUserBehalfPrediction = req.query.prediction; // Updated parameter for the owner's prediction
    //   handleAddByOwner(channelName, ownerUsername, targetUsername, ownerUserBehalfPrediction, res, req);
    //   break;

    default:
      res.status(200).send('Invalid command. Use !predict add/edit/list/status/result');
  }
});

// Move out open, close, and fadd cases to a separate route
app.get('/prediction/:channel/admin/predict', (req, res) => {
  const channelName = req.params.channel;
  const adminCommand = req.query.command;

  switch (adminCommand) {
    case 'open':
      handleOpenPrediction(channelName, res, req);
      break;

    case 'close':
      handleClosePrediction(channelName, res, req);
      break;

    case 'fadd':
      const ownerUsername = req.query.username;
      const targetUsername = req.query.toUsername;
      const ownerUserBehalfPrediction = req.query.prediction;
      handleAddByOwner(channelName, ownerUsername, targetUsername, ownerUserBehalfPrediction, res, req);
      break;

    default:
      res.status(200).send('Invalid admin command. Use !predictadmin open/close/fadd');
  }
});

// Add an admin (GET method)
app.get('/prediction/:channel/admin/addAdmin', (req, res) => {
  const channelName = req.params.channel;
  let adminUsername = req.query.username;

  // Remove '@' symbol if present and convert to lowercase
  adminUsername = adminUsername.replace('@', '').toLowerCase();

  // Load current admins
  const admins = loadAdminsFromFile(channelName);

  // Check if the admin is not already in the list
  if (!admins.includes(adminUsername)) {
    admins.push(adminUsername);

    // Save the updated admins to the file
    saveAdminsFile(channelName, admins);

    res.status(200).send(`Admin ${adminUsername} added successfully into ${channelName}'s Prediction System!`);
  } else {
    res.status(200).send(`Admin ${adminUsername} is already in ${channelName}'s Prediction System!`);
  }
});

// Remove an admin (GET method)
app.get('/prediction/:channel/admin/removeAdmin', (req, res) => {
  const channelName = req.params.channel;
  let adminUsername = req.query.username;

  // Remove '@' symbol if present and convert to lowercase
  adminUsername = adminUsername.replace('@', '').toLowerCase();

  // Load current admins
  const admins = loadAdminsFromFile(channelName);

  // Check if the admin is in the list
  const adminIndex = admins.indexOf(adminUsername);
  if (adminIndex !== -1) {
    admins.splice(adminIndex, 1);

    // Save the updated admins to the file
    saveAdminsFile(channelName, admins);

    res.status(200).send(`Admin ${adminUsername} removed successfully into ${channelName}'s Prediction System!.`);
  } else {
    res.status(200).send(`Admin ${adminUsername} is not in ${channelName}'s Prediction System!`);
  }
});

// List admins for a channel (GET method)
app.get('/prediction/:channel/admin/list', (req, res) => {
  const channelName = req.params.channel;

  // Load admins from the file
  const admins = loadAdminsFromFile(channelName);

  // Send the admins as a string using res.send
  res.status(200).send(`${channelName}'s Prediction Admins: ${admins.join(', ')}`);
});

// Add a prediction with username (GET method)
app.get('/prediction/:channel/add', checkPredictionOpen, (req, res) => {
  const channelName = req.params.channel;
  const username = req.query.username;
  const prediction = req.query.prediction;

  // Check if prediction is empty
  if (!prediction || prediction == null || prediction == undefined) {
    res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !addpredict 13-9`);
    return;
  }

  if (isValidPredictionFormat(prediction)) {
    // Check if the user has already submitted a prediction
    const existingPrediction = predictions.find((item) => item.username === username);
    if (existingPrediction) {
      res.status(200).send(`${username}: You have already submitted your prediction: ${existingPrediction.prediction}`);
    } else {
      predictions.push({ username, prediction });

      // Save the predictions to a local JSON file
      fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

      res.status(200).send(`Prediction added successfully for ${username}. Your prediction: ${prediction}`);
    }
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
});

// Edit a prediction (admin only) (GET method)
app.get('/prediction/:channel/edit', checkPredictionOpen, (req, res) => {
  // Add admin authentication logic here if needed
  const channelName = req.params.channel;
  const username = req.query.username;
  const newPrediction = req.query.prediction;

  if (isValidPredictionFormat(newPrediction)) {
    if (!config.isPredictionOpen) {
      res.status(200).send(`${username}: Predictions are closed. You cannot edit predictions.`);
    } else {
      const predictionIndex = predictions.findIndex((item) => item.username === username);
      if (predictionIndex !== -1) {
        predictions[predictionIndex].prediction = newPrediction;

        // Update the local JSON file
        fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

        res.status(200).send(`Prediction edited successfully for ${username}. New prediction: ${newPrediction}`);
      } else {
        res.status(200).send(`Prediction for ${username} is not found.`);
      }
    }
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
});

// List all current predictions (GET method)
app.get('/prediction/:channel/list', (req, res) => {
  const channelName = req.params.channel;
  const predictions = loadPredictionsFromFile(channelName);

  // Check if there are predictions
  if (predictions.length === 0) {
    res.status(200).send(`Predictions are empty for channel, ${channelName}.`);
    return;
  }

  const predictionList = predictions.map((item) => `${item.username}: ${item.prediction}`).join(', ');
  res.status(200).send(`[Current Predictions] ${predictionList}`);
});

// Show prediction results (GET method)
app.get('/prediction/:channel/result', (req, res) => {
  const channelName = req.params.channel;

  // Retrieve the actual result from the query parameters
  const actualResult = req.query.result;

  // Check if predictions are closed
  if (!config.isPredictionOpen) {
    // Calculate the winners
    const winners = predictions.filter((item) => item.prediction === actualResult);

    if (winners.length > 0) {
      const winnerUsernames = winners.map((winner) => winner.username).join(', ');
      res.status(200).send(`[Prediction Result] Winners: ${winnerUsernames}. Actual Result: ${actualResult}`);
    } else {
      res.status(200).send(`[Prediction Result] No winners. Actual Result: ${actualResult}`);
    }
  } else {
    res.status(200).send('Predictions are still open. Results will be available after closing predictions.');
  }
});

// Add a prediction by channel owner (GET method)
app.get('/prediction/:channel/addByOwner', (req, res) => {
  const channelName = req.params.channel;
  let username = req.query.username;
  const prediction = req.query.prediction;

  // Remove '@' symbol from the targetUsername
  username = username.replace('@', '');

  // Check if prediction is empty
  if (!prediction || prediction == null || prediction == undefined) {
    res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !fpredict username 13-9`);
    return;
  }

  if (isValidPredictionFormat(prediction)) {
    predictions.push({ username, prediction });

    // Save the predictions to a local JSON file
    fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

    res.status(200).send(`Prediction added successfully for ${username}. Prediction: ${prediction}`);
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
});

// Add a prediction by channel owner (GET method)
app.get('/prediction/:channel/addByMods', (req, res) => {
  const channelName = req.params.channel;
  const modUsername = req.query.mods;
  let username = req.query.username;
  const prediction = req.query.prediction;

  // Remove '@' symbol from the targetUsername
  username = username.replace('@', '');

  // Check if prediction is empty
  if (!prediction || prediction == null || prediction == undefined) {
    res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !fpredict username 13-9`);
    return;
  }

  if (isValidPredictionFormat(prediction)) {
    predictions.push({ username, prediction });

    // Save the predictions to a local JSON file
    fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

    res.status(200).send(`Prediction added successfully for ${username} by ${channelName}'s Mod, ${modUsername}. Prediction: ${prediction}`);
  } else {
    res.status(200).send(`Prediction format is invalid for ${username}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
  }
});

// Add a prediction by channel admins (GET method)
app.get('/prediction/:channel/addByAdmins', (req, res) => {
  const channelName = req.params.channel;
  const adminUsername = req.query.admins;
  let targetUsername = req.query.username;  // Change from const to let
  const prediction = req.query.prediction;

  // Load admins from the file
  const admins = loadAdminsFromFile(channelName)

  // Remove '@' symbol from the targetUsername
  targetUsername = targetUsername.replace('@', '');

  // Check if the admin is allowed to add predictions for others
  if (admins.includes(adminUsername.toLowerCase())) {
    // Check if prediction is empty
    if (!prediction || prediction == null || prediction == undefined) {
      res.status(200).send(`Please provide a prediction with the format: xx-xx. Example: !fadminpredict username 13-9`);
      return;
    }

    if (isValidPredictionFormat(prediction)) {
      const targetUserPrediction = { username: targetUsername, prediction };
      predictions.push(targetUserPrediction);

      // Save the predictions to a local JSON file
      fs.writeFileSync(`predictions_${channelName}.json`, JSON.stringify(predictions, null, 2), 'utf8');

      res.status(200).send(`Prediction added successfully for ${targetUsername} by ${channelName}'s Prediction System Admin, ${adminUsername}. Prediction: ${prediction}`);
    } else {
      res.status(200).send(`Prediction format is invalid for ${targetUsername}. Use the allowed formats, xx-xx. Each side must be either in 13.`);
    }
  } else {
    res.status(200).send(`Access denied. ${adminUsername} must be listed in the ${channelName}'s admin list.`);
  }
});

// Check if prediction is open or closed (GET method)
app.get('/prediction/:channel/status', (req, res) => {
  const channelName = req.params.channel;
  const statusMessage = config.isPredictionOpen
    ? 'Predictions are currently open.'
    : 'Predictions are currently closed.';

  res.status(200).send(statusMessage);
});

// Listen on a specific port
const port = process.env.PORT || 6000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
