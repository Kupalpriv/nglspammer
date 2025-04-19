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

  const spamCount = parseInt(amount);
  if (isNaN(spamCount) || spamCount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = new Date().toISOString();
  const logDir = path.join(__dirname, '../logs');
  const logFile = path.join(logDir, 'ngl.log');

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  let success = 0;
  let failed = 0;

  for (let i = 0; i < spamCount; i++) {
    try {
      await axios.post('https://ngl.link/api/submit', {
        username,
        question: message,
        deviceId: '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
        gameSlug: '',
        referrer: '',
      });
      success++;
    } catch (err) {
      failed++;
      if (err.response?.status === 429) {
        await delay(1000);
        i--; // retry
        continue;
      }
    }
    await delay(300);
  }

  const logEntry = `[${timestamp}] IP: ${clientIp} | User: ${username} | Sent: ${success}/${spamCount} | Failed: ${failed} | Msg: "${message}"\n`;

  fs.appendFile(logFile, logEntry, err => {
    if (err) console.error('Error writing to log file:', err);
  });

  console.log(logEntry.trim());

  res.json({ success: true, message: `Successfully spammed ${spamCount} times to ${username}` });
};
