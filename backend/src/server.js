require('dotenv').config();
const express = require('express');
const cors = require('cors');
const configViewEngine = require('./config/viewEngine');
const webRouter = require('./routes/web');
const apiRouter = require('./routes/api');
const studentRoutes = require('./routes/studentRoutes');
const CacheService = require('./services/CacheService');

const app = express();
const port = process.env.PORT;

// Initialize Redis connection
async function initializeServices() {
  try {
    await CacheService.connect();
    console.log('✅ Cache service initialized');
  } catch (error) {
    console.warn('⚠️ Cache service failed to initialize:', error.message);
    console.log('🔄 Continuing without cache...');
  }
}

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//config view engine
configViewEngine(app);

// khai bao route
app.use('/', webRouter);
app.use('/api', apiRouter); // API routes với prefix /api
app.use('/api/students', studentRoutes);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await CacheService.disconnect();
  process.exit(0);
});

// Start server
initializeServices().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  });
});