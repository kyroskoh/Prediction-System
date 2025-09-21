# Prediction System v2.0 🎯

**Enhanced CS2 & Valorant Prediction System with MongoDB, JWT Authentication, Real-time Updates & Docker Support**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green)](https://mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue)](https://docker.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-orange)](https://socket.io/)

## 🚀 What's New in v2.0

### ✨ Major Enhancements
- **🗄️ MongoDB Database**: Scalable data persistence replacing JSON files
- **🔐 JWT Authentication**: Secure user authentication and authorization
- **⚡ Real-time Updates**: WebSocket support with Socket.IO
- **🛡️ Rate Limiting**: Anti-spam protection with role-based limits
- **🐳 Docker Support**: Easy deployment with Docker & Docker Compose
- **🧪 Comprehensive Testing**: Unit & integration tests with 90%+ coverage
- **📊 Enhanced Logging**: Structured logging with Winston
- **🔒 Security**: Helmet.js, CORS, input validation, and more

### 🔄 Backward Compatibility
- **100% NightBot Compatible**: All existing commands work unchanged
- **Legacy API Support**: Original endpoints maintained
- **Migration**: Automatic data migration from JSON files

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [NightBot Commands](#-nightbot-commands)
- [Docker Deployment](#-docker-deployment)
- [Development](#-development)
- [Testing](#-testing)
- [Configuration](#-configuration)
- [Security](#-security)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start with Docker
git clone https://github.com/kyroskoh/Prediction-System.git
cd Prediction-System
docker-compose up -d

# Your API is now running on http://localhost:6000
```

### Option 2: Local Development

```bash
# Prerequisites: Node.js 18+, MongoDB running locally
git clone https://github.com/kyroskoh/Prediction-System.git
cd Prediction-System
npm install
npm run dev

# Server starts on http://localhost:6000
```

## 📦 Installation

### Prerequisites
- **Node.js 18.x or higher**
- **MongoDB 6.0+ or Docker**
- **Git**

### Local Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/kyroskoh/Prediction-System.git
   cd Prediction-System
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start MongoDB** (if not using Docker)
   ```bash
   # Windows
   mongod --dbpath C:\\data\\db
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

5. **Run the Application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Documentation

### Health & Status
```http
GET /                    # API health check
GET /health             # Detailed health status
GET /api/docs           # API documentation
```

### Legacy NightBot Endpoints (v1 Compatible)
All original endpoints work unchanged:

```http
GET /prediction/:channel/open                    # Open new prediction
GET /prediction/:channel/close                   # Close predictions  
GET /prediction/:channel/add?username=X&prediction=13-10     # Add prediction
GET /prediction/:channel/edit?username=X&prediction=13-11    # Edit prediction
GET /prediction/:channel/list                    # List all predictions
GET /prediction/:channel/status                  # Check open/closed status
GET /prediction/:channel/result?result=13-10     # Set result & show winners

# Admin Management
GET /prediction/:channel/admin/addAdmin?username=X    # Add admin
GET /prediction/:channel/admin/removeAdmin?username=X # Remove admin  
GET /prediction/:channel/admin/list               # List admins

# Force Add (Special Permissions)
GET /prediction/:channel/addByOwner?username=X&prediction=13-10    # Owner force add
GET /prediction/:channel/addByMods?mods=Y&username=X&prediction=13-10    # Mod force add
GET /prediction/:channel/addByAdmins?admins=Z&username=X&prediction=13-10 # Admin force add
```

### Real-time WebSocket Events
```javascript
// Client-side Socket.IO connection
const socket = io('http://localhost:6000');

// Join channel for updates
socket.emit('join-channel', 'yourchannelname');

// Listen for events
socket.on('prediction-opened', (data) => {
  console.log('New prediction opened:', data);
});

socket.on('prediction-added', (data) => {
  console.log('New prediction added:', data);
});

socket.on('prediction-closed', (data) => {
  console.log('Predictions closed:', data);
});

socket.on('prediction-resolved', (data) => {
  console.log('Results announced:', data);
});
```

## 🤖 NightBot Commands

### For Everyone

**Add Prediction:**
```
!addcom !apredict -cd=5 $(urlfetch https://your-api-url/prediction/$(channel)/add?username=$(user)&prediction=$(1))
```
Usage: `!apredict 13-11`

**Edit Prediction:**
```
!addcom !epredict -cd=5 $(urlfetch https://your-api-url/prediction/$(channel)/edit?username=$(user)&prediction=$(1))
```
Usage: `!epredict 11-13`

**List Predictions:**
```
!addcom !lpredict -cd=5 $(urlfetch https://your-api-url/prediction/$(channel)/list)
```

**Check Status:**
```
!addcom !spredict -cd=5 $(urlfetch https://your-api-url/prediction/$(channel)/status)
```

### For Moderators

**Open Prediction:**
```
!addcom !opredict -cd=5 -ul=mod $(urlfetch https://your-api-url/prediction/$(channel)/open)
```

**Close Prediction:**
```
!addcom !cpredict -cd=5 -ul=mod $(urlfetch https://your-api-url/prediction/$(channel)/close)
```

**Set Results:**
```
!addcom !wpredict -cd=5 -ul=mod $(urlfetch https://your-api-url/prediction/$(channel)/result?result=$(1))
```
Usage: `!wpredict 13-10`

### For Channel Owners

**Add Admin:**
```
!addcom !addadmin -cd=5 -ul=owner $(urlfetch https://your-api-url/prediction/$(channel)/admin/addAdmin?username=$(1))
```

**Force Add Prediction:**
```
!addcom !fpredict -cd=5 -ul=owner $(urlfetch https://your-api-url/prediction/$(channel)/addByOwner?username=$(1)&prediction=$(2))
```

## 🐳 Docker Deployment

### Quick Deploy
```bash
# Start everything (API + MongoDB + Mongo Express UI)
docker-compose up -d

# View logs
docker-compose logs -f prediction-system

# Stop services
docker-compose down
```

### Services Running
- **API**: http://localhost:6000
- **MongoDB**: localhost:27017  
- **Mongo Express UI**: http://localhost:8081 (admin/admin123)

### Production Deployment
```bash
# Build production image
docker build -t prediction-system:latest .

# Deploy with custom environment
docker run -d \
  --name prediction-api \
  -p 6000:6000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secure-secret \
  -e MONGODB_URI=mongodb://mongo:27017/prediction-system \
  prediction-system:latest
```

## 💻 Development

### Project Structure
```
src/
├── config/          # Environment configuration
├── middleware/      # Authentication, rate limiting, etc.
├── models/          # MongoDB models (User, Channel, Prediction)
├── routes/          # API routes (auth, channels, predictions, legacy)
├── utils/           # Helper utilities (JWT, validation, etc.)
└── server.js        # Main server file

tests/
├── integration/     # API endpoint tests
├── unit/           # Model and utility tests
└── setup.js        # Test environment setup
```

### Available Scripts
```bash
npm run dev          # Start development server
npm test             # Run all tests
npm run test:watch   # Watch mode testing  
npm run test:coverage # Test coverage report
npm run lint         # Code linting
npm run docker:build # Build Docker image
npm run docker:run   # Start Docker services
```

### Development Workflow

1. **Start Development Environment**
   ```bash
   # Terminal 1: Start MongoDB
   docker run -d --name dev-mongo -p 27017:27017 mongo:6.0
   
   # Terminal 2: Start API in watch mode
   npm run dev
   ```

2. **Run Tests**
   ```bash
   # Run all tests
   npm test
   
   # Watch mode for TDD
   npm run test:watch
   
   # Check coverage
   npm run test:coverage
   ```

3. **API Testing**
   ```bash
   # Test health endpoint
   curl http://localhost:6000/health
   
   # Test legacy endpoint
   curl "http://localhost:6000/prediction/testchannel/open"
   ```

## 🧪 Testing

### Test Suite Features
- **Unit Tests**: Model validation, utility functions
- **Integration Tests**: Full API endpoint testing  
- **In-Memory Database**: MongoDB Memory Server for isolated tests
- **Coverage Reporting**: Detailed coverage with Istanbul
- **CI/CD Ready**: GitHub Actions compatible

### Running Tests
```bash
# All tests
npm test

# Integration tests only  
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode during development
npm run test:watch
```

### Test Results Example
```
PASS tests/integration/legacy.test.js
✓ Health Check > GET / should return alive message
✓ Prediction Lifecycle > Should open, add, list, close, and resolve predictions
✓ Should validate prediction format
✓ Should handle admin operations
✓ Error Handling > Should handle missing parameters

Test Suites: 3 passed, 3 total
Tests:       25 passed, 25 total
Coverage:    92.4% statements, 89.1% branches, 94.2% functions, 91.8% lines
```

## ⚙️ Configuration

### Environment Variables

Create `.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=6000

# MongoDB Configuration  
MONGODB_URI=mongodb://localhost:27017/prediction-system
MONGODB_TEST_URI=mongodb://localhost:27017/prediction-system-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
SOCKET_IO_ORIGINS=*

# Logging
LOG_LEVEL=info
```

### Rate Limiting Configuration

Different user roles have different limits:
- **Owner**: 1000 requests/15min
- **Admin**: 500 requests/15min  
- **Moderator**: 200 requests/15min
- **User**: 100 requests/15min
- **Predictions**: 10 actions/5min (bypassed for mods+)

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure authentication with refresh tokens
- **Role-Based Access**: Owner > Admin > Moderator > User hierarchy
- **Channel Isolation**: Users can only access authorized channels

### Security Middleware
- **Helmet.js**: Security headers (XSS, HSTS, etc.)
- **CORS**: Configured for NightBot and web clients
- **Rate Limiting**: DDoS protection with role-based limits
- **Input Validation**: Comprehensive request validation
- **MongoDB Injection**: Protected with Mongoose schemas

### Best Practices
- **Environment Secrets**: All sensitive data in environment variables
- **Non-root Container**: Docker runs as non-privileged user
- **Request Logging**: Comprehensive audit trail
- **Error Handling**: Secure error responses (no stack traces in production)

## 📊 Monitoring & Logs

### Logging
- **Winston Logger**: Structured JSON logging
- **Log Levels**: error, warn, info, debug
- **Log Files**: `logs/error.log`, `logs/combined.log`
- **Console Output**: Development mode only

### Health Monitoring
```bash
# Health check endpoint
curl http://localhost:6000/health

# Response includes:
{
  "status": "healthy",
  "database": "connected", 
  "uptime": 3600,
  "memory": { "rss": 45000000, "heapUsed": 25000000 },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Production Deployment

### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-prediction-api

# Set environment variables
heroku config:set JWT_SECRET=your-production-secret
heroku config:set MONGODB_URI=your-production-mongodb-uri
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### VPS Deployment with Docker
```bash
# On your VPS
git clone https://github.com/kyroskoh/Prediction-System.git
cd Prediction-System

# Copy production environment
cp .env.production .env
# Edit .env with production values

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Setup reverse proxy (nginx example)
# Proxy requests to http://localhost:6000
```

## 🔄 Migration from v1

### Automatic Migration
The system automatically handles migration:
1. **User Creation**: Legacy users are created on-demand
2. **Channel Setup**: Channels are created when first accessed  
3. **Data Persistence**: All data moves from JSON files to MongoDB
4. **API Compatibility**: All existing NightBot commands work unchanged

### Manual Migration (Optional)
```bash
# Run migration script to import existing JSON data
npm run db:seed
```

## 📝 API Rate Limits

| Endpoint Type | Rate Limit | Window | Notes |
|---------------|------------|---------|--------|
| General API | 100 req | 15 min | Per IP/User |
| Predictions | 10 req | 5 min | Bypassed for mods+ |
| Admin Operations | 50 req | 10 min | Admin actions |
| Authentication | 5 req | 15 min | Login attempts |
| Registration | 3 req | 1 hour | New accounts |

## ❓ FAQ

**Q: Will my existing NightBot commands still work?**  
A: Yes! 100% backward compatibility. No changes needed.

**Q: Do I need to migrate my data manually?**  
A: No, the system automatically creates users and channels as needed.

**Q: Can I use both v1 and v2 simultaneously?**  
A: No, v2 replaces v1 completely but maintains all functionality.

**Q: How do I enable real-time updates?**  
A: Implement Socket.IO client connection as shown in the WebSocket documentation.

**Q: Is authentication required for NightBot?**  
A: No, legacy endpoints work without authentication for backward compatibility.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Write tests for new features
- Maintain backward compatibility
- Follow existing code style
- Update documentation

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original prediction system for CS2 & Valorant
- NightBot integration community
- Socket.IO for real-time features
- MongoDB for scalable data storage
- Express.js ecosystem

---

**Made with ❤️ for the gaming community**

For questions or support, please open an issue on GitHub.