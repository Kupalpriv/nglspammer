const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// API Endpoint (Enhanced error handling)
app.post('/api/nglspam', async (req, res) => {
  try {
    const { username, message, amount } = req.body;
    
    // Validation
    if (!username || !message || !amount) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    if (amount > 50) {
      return res.status(422).json({ error: 'Maximum 50 messages per request' });
    }

    const results = [];
    for (let i = 0; i < amount; i++) {
      try {
        const response = await axios.post('https://ngl.link/api/submit', {
          username: username,
          question: message,
          deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
          gameSlug: '',
          referrer: '',
        });
        results.push({ 
          status: response.status, 
          message: `Message ${i + 1} sent successfully`,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({ 
          error: error.message,
          status: error.response?.status || 500
        });
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
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
