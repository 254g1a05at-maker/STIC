const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const { initDb } = require('./server/db');

// Initialize SQLite database schema & seeds
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve Uploaded Files Statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routers
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/dashboard', require('./server/routes/dashboard'));
app.use('/api/members', require('./server/routes/members'));
app.use('/api/departments', require('./server/routes/departments'));
app.use('/api/programs', require('./server/routes/programs'));
app.use('/api/photos', require('./server/routes/photos'));
app.use('/api/videos', require('./server/routes/videos'));
app.use('/api/documents', require('./server/routes/documents'));
app.use('/api/finance', require('./server/routes/finance'));
app.use('/api/sponsors', require('./server/routes/sponsors'));
app.use('/api/social', require('./server/routes/social'));
app.use('/api/coordinators', require('./server/routes/coordinators'));
app.use('/api/search', require('./server/routes/search'));
app.use('/api/settings', require('./server/routes/settings'));
app.use('/api/announcements', require('./server/routes/announcements'));
app.use('/api/activity-log', require('./server/routes/activity-log'));
app.use('/api/audit-logs', require('./server/routes/activity-log'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'STIC – Innovate. Sustain. Impact.',
    time: new Date().toISOString()
  });
});

// Serve frontend dist in production if built
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  }));

  // Universal SPA fallback middleware (Express 4 & 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(path.join(clientDist, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` STIC Club Management Server is Running on port ${PORT}`);
  console.log(` Brand: STIC – Innovate. Sustain. Impact.`);
  console.log(` Web Portal: http://localhost:${PORT}`);
  console.log(` Default Admin: admin / admin@123`);
  console.log(`=======================================================`);
});
