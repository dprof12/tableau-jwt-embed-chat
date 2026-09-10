const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  const targetUrl = 'https://data-statistik.jakarta.go.id/vizportal/api/web/v1/auth/embed/signin';

  try {
    const wafResult = await new Promise((resolve, reject) => {
      const options = {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://tableau-jwt-embed-chat.vercel.app',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 6000
      };

      const request = https.request(targetUrl, options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: body
          });
        });
      });

      request.on('error', (err) => reject(err));
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Connection to Tableau Server timed out'));
      });

      request.end();
    });

    // Parse Support ID from WAF HTML
    let supportId = 'Unknown';
    const match = wafResult.body.match(/id=["']sp-id["'][^>]*>\s*([0-9]+)\s*<\/span>/i) ||
                  wafResult.body.match(/Support ID.*?([0-9]{15,25})/i);
    if (match) {
      supportId = match[1].trim();
    }

    const isBlocked = wafResult.body.includes('URL YANG DIMINTA DI TOLAK') || wafResult.body.includes('sp-id');

    return res.status(200).json({
      success: true,
      url: targetUrl,
      method: 'OPTIONS',
      blockedByWaf: isBlocked,
      supportId: supportId,
      statusCode: wafResult.statusCode,
      wafHtml: wafResult.body
    });

  } catch (err) {
    console.error('Error checking WAF:', err);
    return res.status(500).json({
      success: false,
      url: targetUrl,
      error: err.message
    });
  }
};
