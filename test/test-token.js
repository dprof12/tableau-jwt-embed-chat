const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('--- Testing Tableau Connected App JWT Generation ---');

const clientId = process.env.TABLEAU_CLIENT_ID;
const secretId = process.env.TABLEAU_SECRET_ID;
const secretValue = process.env.TABLEAU_SECRET_VALUE;
const username = process.env.TABLEAU_USERNAME;

console.log('Client ID   :', clientId);
console.log('Secret ID   :', secretId);
console.log('Username    :', username);
console.log('Secret Value:', secretValue ? '[LOADED]' : '[MISSING]');

if (!clientId || !secretId || !secretValue || !username) {
  console.error('❌ Error: Incomplete credentials in .env');
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
const exp = now + (10 * 60);
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

try {
  const token = jwt.sign(payload, secretValue, { header });
  console.log('\n✅ JWT generated successfully!');
  console.log('Token snippet:', token.substring(0, 45) + '...');
  
  // Verify token
  const decoded = jwt.verify(token, secretValue, { complete: true });
  console.log('\nDecoded Header :', JSON.stringify(decoded.header, null, 2));
  console.log('Decoded Payload:', JSON.stringify(decoded.payload, null, 2));
  console.log('\n🎉 Test Passed! Token is ready for Tableau Server.');
} catch (err) {
  console.error('❌ Error verifying token:', err.message);
}
