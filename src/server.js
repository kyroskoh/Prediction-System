const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const winston = require('winston');

// Import configuration and utilities
const config = require('./config');
const { defaultLimiter } = require('./middleware/rateLimiter');
const { optionalAuth } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const predictionRoutes = require('./routes/predictions');
const channelRoutes = require('./routes/channels');
const legacyRoutes = require('./routes/legacyComplete');

// Configure logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'prediction-system' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

class PredictionServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: config.SOCKET_IO_ORIGINS,
        methods: ['GET', 'POST']
      }
    });
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false // Allow embedding for NightBot
    }));
    
    // CORS configuration
    this.app.use(cors({
      origin: config.NODE_ENV === 'production' 
        ? ['https://nightbot.tv', 'https://beta.nightbot.tv']
        : true,
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use('/api/', defaultLimiter);

    // Optional authentication for all routes
    this.app.use(optionalAuth);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user ? req.user.username : 'anonymous'
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/', (req, res) => {
      res.json({ 
        message: 'Prediction System API v2.0',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });

    // Legacy routes for backward compatibility with NightBot
    this.app.use('/prediction', legacyRoutes);

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        message: 'Prediction System API Documentation',
        version: '2.0.0',
        endpoints: {
          legacy: {
            'GET /prediction/:channel/*': 'Legacy NightBot endpoints (compatible with v1)'
          }
        }
      });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Join channel room
      socket.on('join-channel', (channelName) => {
        socket.join(`channel:${channelName}`);
        logger.info('Client joined channel', { 
          socketId: socket.id, 
          channel: channelName 
        });
      });

      // Leave channel room
      socket.on('leave-channel', (channelName) => {
        socket.leave(`channel:${channelName}`);
        logger.info('Client left channel', { 
          socketId: socket.id, 
          channel: channelName 
        });
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    // Make io available to routes
    this.app.set('io', this.io);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        user: req.user ? req.user.username : 'anonymous'
      });

      // Don't expose error details in production
      const message = config.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message;

      res.status(err.status || 500).json({
        error: message,
        ...(config.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });
  }

  async connectDatabase() {
    try {
      const uri = config.NODE_ENV === 'test' 
        ? config.MONGODB_TEST_URI 
        : config.MONGODB_URI;
      
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('Connected to MongoDB', { 
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      });
    } catch (error) {
      logger.error('MongoDB connection failed', { error: error.message });
      process.exit(1);
    }
  }

  async start() {
    try {
      // Create logs directory
      const fs = require('fs');
      if (!fs.existsSync('logs')) {
        fs.mkdirSync('logs');
      }

      // Connect to database
      await this.connectDatabase();

      // Start server
      this.server.listen(config.PORT, () => {
        logger.info('Server started', {
          port: config.PORT,
          environment: config.NODE_ENV,
          nodeVersion: process.version
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
      
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down server...');
    
    // Close HTTP server
    this.server.close(() => {
      logger.info('HTTP server closed');
    });

    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new PredictionServer();
  server.start();
}

module.exports = PredictionServer;
