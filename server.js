const express = require('express');
const path = require('path');
const nglspam = require('./src/nglspam');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/nglspam', nglspam);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
