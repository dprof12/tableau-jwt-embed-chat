const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const clientId = process.env.TABLEAU_CLIENT_ID;
    const secretId = process.env.TABLEAU_SECRET_ID;
    const secretValue = process.env.TABLEAU_SECRET_VALUE;

    if (!clientId || !secretId || !secretValue) {
      return res.status(500).json({
        success: false,
        error: 'Tableau Connected App credentials are not configured in environment variables.'
      });
    }

    const username = (req.body && req.body.username) || process.env.TABLEAU_USERNAME || 'satudata';
    const now = Math.floor(Date.now() / 1000);
    const expiresInSeconds = 10 * 60; // 10 minutes
    const exp = now + expiresInSeconds;
    const jti = uuidv4();

    const payload = {
      iss: clientId,
      exp: exp,
      jti: jti,
      aud: 'tableau',
      sub: username,
      scp: ['tableau:views:embed', 'tableau:views:embed_authoring']
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT',
      kid: secretId,
      iss: clientId
    };

    const token = jwt.sign(payload, secretValue, { header });

    return res.status(200).json({
      success: true,
      token,
      username,
      issuedAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInSeconds,
      jti
    });
  } catch (error) {
    console.error('Error generating Tableau token on Vercel:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
