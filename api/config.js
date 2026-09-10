module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    serverUrl: process.env.TABLEAU_SERVER_URL || 'https://data-statistik.jakarta.go.id',
    defaultViewUrl: process.env.TABLEAU_DEFAULT_VIEW_URL || 'https://data-statistik.jakarta.go.id/views/Superstore/Overview',
    defaultUsername: process.env.TABLEAU_USERNAME || 'satudata',
    clientId: process.env.TABLEAU_CLIENT_ID ? `${process.env.TABLEAU_CLIENT_ID.substring(0, 8)}...` : 'Not Set'
  });
};
