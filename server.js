const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generate Tableau Connected App JWT
function generateTableauToken(username) {
  const clientId = process.env.TABLEAU_CLIENT_ID;
  const secretId = process.env.TABLEAU_SECRET_ID;
  const secretValue = process.env.TABLEAU_SECRET_VALUE;

  if (!clientId || !secretId || !secretValue) {
    throw new Error('Tableau Connected App credentials (CLIENT_ID, SECRET_ID, SECRET_VALUE) are not configured.');
  }

  const user = username || process.env.TABLEAU_USERNAME || 'satudata';
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = 10 * 60; // 10 minutes (Tableau max recommended is 10 mins)
  const exp = now + expiresInSeconds;
  const jti = uuidv4();

  const payload = {
    iss: clientId,
    exp: exp,
    jti: jti,
    aud: 'tableau',
    sub: user,
    scp: ['tableau:views:embed', 'tableau:views:embed_authoring']
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: secretId,
    iss: clientId
  };

  const token = jwt.sign(payload, secretValue, {
    header: header
  });

  return {
    token,
    username: user,
    issuedAt: new Date(now * 1000).toISOString(),
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresInSeconds,
    jti
  };
}

// Public configuration endpoint (Safe, no secret values exposed)
app.get('/api/config', (req, res) => {
  res.json({
    serverUrl: process.env.TABLEAU_SERVER_URL || 'https://data-statistik.jakarta.go.id',
    defaultViewUrl: process.env.TABLEAU_DEFAULT_VIEW_URL || 'https://data-statistik.jakarta.go.id/views/Superstore/Overview',
    defaultUsername: process.env.TABLEAU_USERNAME || 'satudata',
    clientId: process.env.TABLEAU_CLIENT_ID ? `${process.env.TABLEAU_CLIENT_ID.substring(0, 8)}...` : 'Not Set'
  });
});

// Endpoint to generate JWT token on demand
app.post('/api/tableau-token', (req, res) => {
  try {
    const { username } = req.body;
    const tokenData = generateTableauToken(username);
    res.json({
      success: true,
      ...tokenData
    });
  } catch (error) {
    console.error('Error generating Tableau token:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Tableau Server JWT Embed Portal is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🎯 Target Tableau: ${process.env.TABLEAU_SERVER_URL || 'https://data-statistik.jakarta.go.id'}`);
  console.log(`👤 Target User: ${process.env.TABLEAU_USERNAME || 'satudata'}`);
  console.log(`====================================================`);
});
