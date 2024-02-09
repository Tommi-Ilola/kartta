// tiedosto: netlify/functions/fetch-ratanumerot.background.js

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    try {
        // Esimerkki datan hakemisesta Digitrafficin API:sta
        const response = await fetch('https://rata.digitraffic.fi/infra-api/0.7/radat.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        };
    } catch (error) {
        console.error('Virhe ladattaessa radat.geojson dataa:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' })
        };
    }
};
