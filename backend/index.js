const express = require('express');
const path = require('path');
const app = express();
// ...existing middleware...

// serve Angular static files from the real dist output
const clientAppPath = path.join(__dirname, '../frontend/dist/github-value');
app.use(express.static(clientAppPath));

// ...any other API routes...

// all other routes -> index.html in that same folder
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: clientAppPath });
});

// ...existing startup code...
