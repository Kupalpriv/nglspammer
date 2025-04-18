const axios = require('axios');

module.exports = async (req, res) => {
  const { username, message, amount } = req.body;

  if (!username || !message || !amount) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const spamCount = parseInt(amount);
  if (isNaN(spamCount) || spamCount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    for (let i = 0; i < spamCount; i++) {
      await axios.post('https://ngl.link/api/submit', {
        username,
        question: message,
        deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
        gameSlug: '',
        referrer: '',
      });
    }
    res.json({ success: true, message: `Successfully spammed ${spamCount} times to ${username}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
