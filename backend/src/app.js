const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const encounterRoutes = require('./routes/encounterRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [
        config.frontendUrl,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8080',
      ].filter(Boolean);

      if (
        !origin ||
        allowed.includes(origin) ||
        /\.netlify\.app$/i.test(origin) ||
        /\.pages\.dev$/i.test(origin) ||
        /\.onrender\.com$/i.test(origin) ||
        /\.loca\.lt$/i.test(origin) ||
        /\.trycloudflare\.com$/i.test(origin) ||
        /\.github\.io$/i.test(origin)
      ) {
        return callback(null, true);
      }
      // Assignment / demo: allow other browser clients
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'HealthTech Patient Data API',
    message: 'This is the backend API (JSON). Open the React app at http://localhost:5173 to use the dashboard.',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth/login',
      patients: '/api/patients',
      encounters: '/api/encounters',
      dashboard: '/api/dashboard/metrics',
    },
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'HealthTech API root. See docs/API.md for full reference.',
    routes: [
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/patients',
      'POST /api/encounters',
      'GET  /api/dashboard/metrics',
      'GET  /api/health',
    ],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HealthTech API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

module.exports = app;
