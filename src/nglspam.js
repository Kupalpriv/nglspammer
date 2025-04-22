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

  try {
    const response = await axios.get('https://slixapi.vercel.app/ngl', {
      params: {
        username,
        message,
        spam: spamCount,
        interval: 1000 // optional, adjust if needed
      }
    });

    const result = response.data?.result || [];
    const success = result.filter(item => item.code === 200).length;
    const failed = spamCount - success;

    const logEntry = `[${timestamp}] IP: ${clientIp} | User: ${username} | Sent: ${success}/${spamCount} | Failed: ${failed} | Msg: "${message}"\n`;

    fs.appendFile(logFile, logEntry, err => {
      if (err) console.error('Error writing to log file:', err);
    });

    console.log(logEntry.trim());

    res.json({
      success: true,
      message: `Successfully sent ${success}/${spamCount} messages to ${username}`,
      details: result
    });

  } catch (err) {
    console.error('API request failed:', err.message);
    res.status(500).json({ error: 'Something went wrong with the API request.' });
  }
};
