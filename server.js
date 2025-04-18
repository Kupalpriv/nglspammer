const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Security Middleware
app.use(helmet());
app.use(express.json());
app.use(express.static(__dirname));
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// API Endpoint
app.post('/api/nglspam', async (req, res) => {
  try {
    const { username, message, amount } = req.body;
    
    // Validation
    if (!username || !message || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (amount > 50) return res.status(400).json({ error: 'Max 50 messages' });

    const results = [];
    for (let i = 0; i < amount; i++) {
      try {
        const response = await axios.post('https://ngl.link/api/submit', {
          username,
          question: message,
          deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878'
        });
        results.push({
          status: response.status,
          message: `Message ${i+1} sent`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({ error: error.message });
      }
    }

    res.json({
      success: true,
      stats: {
        total: results.length,
        success: results.filter(r => !r.error).length,
        failed: results.filter(r => r.error).length
      },
      results
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
