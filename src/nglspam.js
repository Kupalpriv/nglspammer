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
  const logDir = path.join(__dirname, '../logs');
  const logFile = path.join(logDir, 'ngl.log');

  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  let success = 0;
  let failed = 0;
  let rateLimited = 0;

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      await delay(300);
    } catch (err) {
      if (err.response?.status === 429) {
        rateLimited++;
        await delay(1000);
        i--; // retry
      } else {
        failed++;
      }
    }
  }

  const finalLog = `[${timestamp}] IP: ${clientIp} | User: ${username} | Msg: "${message}" | Attempted: ${spamCount} | Success: ${success} | RateLimited: ${rateLimited} | Failed: ${failed}\n`;

  fs.appendFile(logFile, finalLog, err => {
    if (err) console.error('Log file error:', err);
  });

  console.log(finalLog.trim());

  res.json({
    success: true,
    message: `Tried: ${spamCount}, Sent: ${success}, Failed: ${failed}, RateLimited: ${rateLimited}`
  });
};
