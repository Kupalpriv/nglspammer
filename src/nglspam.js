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
  const deviceIds = [
    '23d7346e-7d22-4256-80f3-dd4ce3fd8878',
    'd9ae0123-1f67-4e90-a921-3dbcfb6e12c1',
    '7c532c3f-f40f-42b7-b55d-78f537c1a9cf',
    '9f23bc4a-09f8-4d9f-801f-6dd624aef301',
    '2a47d3d6-09a9-44dc-b2d7-497bd876fc3b',
    'abcde123-4567-89ab-cdef-0123456789ab',
    '8e7b90f3-21c4-4ee5-83f2-1fa38291f3e7',
    'd3a9b0cd-143c-41d0-b3ff-5b946234f617'
  ];

  let success = 0;
  let failed = 0;
  let sent = 0;
  const maxConcurrency = 5;

  const sendMessage = async () => {
    const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
    try {
      await axios.post('https://ngl.link/api/submit', {
        username,
        question: message,
        deviceId,
        gameSlug: '',
        referrer: '',
      });
      success++;
    } catch (err) {
      if (err.response?.status === 429) {
        return 'retry';
      } else {
        failed++;
      }
    }
    await delay(100 + Math.random() * 200);
    return 'done';
  };

  while (sent < spamCount) {
    const batch = [];
    const remaining = spamCount - sent;
    const batchSize = remaining >= maxConcurrency ? maxConcurrency : remaining;

    for (let i = 0; i < batchSize; i++) {
      batch.push(sendMessage());
    }

    const results = await Promise.all(batch);
    results.forEach(result => {
      if (result === 'retry') sent--;
    });

    sent += batchSize;
    await delay(500);
  }

  const logEntry = `[${timestamp}] IP: ${clientIp} | User: ${username} | Sent: ${success}/${spamCount} | Failed: ${failed} | Msg: "${message}"\n`;

  fs.appendFile(logFile, logEntry, err => {
    if (err) console.error('Error writing to log file:', err);
  });

  console.log(logEntry.trim());

  res.json({ success: true, message: `Successfully spammed ${success}/${spamCount} to ${username}`, failed });
};
