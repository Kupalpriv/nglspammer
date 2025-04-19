const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  let { username, message, amount } = req.body;

  if (!username || !message || !amount) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const match = username.match(/(?:https?:\/\/)?(?:www\.)?ngl\.link\/([a-zA-Z0-9._-]+)/);
  if (match) username = match[1];

  const spamCount = parseInt(amount, 10);
  if (isNaN(spamCount) || spamCount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] IP: ${clientIp} | User: ${username} | Msg: "${message}" | Amount: ${spamCount}\n`;

  console.log(logMessage.trim());
  fs.appendFile(path.join(__dirname, '../logs/ngl.log'), logMessage, err => {
    if (err) console.error('Log file error:', err);
  });

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    for (let i = 0; i < spamCount; i++) {
      try {
        await axios.post('https://ngl.link/api/submit', {
          username,
          question: message,
          deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
          gameSlug: '',
          referrer: '',
        });
        await delay(300);
      } catch (err) {
        if (err.response?.status === 429) {
          await delay(1000);
          i--;
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true, message: `Successfully spammed ${spamCount} times to ${username}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
