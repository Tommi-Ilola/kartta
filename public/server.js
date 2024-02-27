const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Välityspalvelimen konfiguraatio
const API_SERVICE_URL = "https://rata.digitraffic.fi";

app.use('/api', createProxyMiddleware({
  target: 'https://rata.digitraffic.fi',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/infra-api',
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxy-pyyntö lähetetään osoitteeseen:', proxyReq.protocol + '//' + proxyReq.host + proxyReq.path);
  }
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Välityspalvelin käynnissä osoitteessa http://localhost:${PORT}`));

