const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Endpoint
app.post('/api/nglspam', async (req, res) => {
    try {
        const { username, message, amount } = req.body;
        
        if (!username || !message || !amount) {
            return res.status(400).json({ error: 'Missing required parameters' });
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
                results.push({ status: response.status, message: `Message ${i + 1} sent` });
            } catch (error) {
                results.push({ error: error.message });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
