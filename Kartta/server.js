const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Välityspalvelimen konfiguraatio
const API_SERVICE_URL = "https://rata.digitraffic.fi";

app.use('/infra-api', createProxyMiddleware({
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    [`^/infra-api`]: '',
  },
}));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Välityspalvelin käynnissä osoitteessa http://localhost:${PORT}`));

