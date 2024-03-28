function haeKaikkiRatanumerot() {
    naytaDatanLatausIndikaattori();
    const url = '/api/infra-api/0.7/radat.geojson';
	
    console.log("Tehdään API-kutsu osoitteeseen:", url); // Lisätty console.log
    fetch(url)
        .then(response => response.json())
        .then(data => {
            ratanumerot = data.features.map(feature => feature.properties.ratanumero);
            console.log(ratanumerot);
            piilotaDatanLatausIndikaattori();
        })
        .catch(error => console.error('Virhe ladattaessa radat.geojson dataa:', error));
}

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Tässä esimerkissä välitetään kaikki Digitrafficin API-kutsut
app.use('/infra-api', createProxyMiddleware({
  target: 'https://rata.digitraffic.fi',
  changeOrigin: true,
  pathRewrite: {
    '^/infra-api': '', // Poista reitin alkuosa, jotta se vastaa kohdepalvelimen polkua
  },
}));

const PORT = 3000; // Voit vaihtaa portin tarvittaessa
app.listen(PORT, () => {
  console.log(`Proxy-palvelin käynnissä portissa ${PORT}`);
});
