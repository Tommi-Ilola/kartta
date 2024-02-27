const https = require('https');

exports.handler = async function(event, context) {
  return new Promise((resolve, reject) => {
    const url = 'https://rata.digitraffic.fi/infra-api/0.7/radat.geojson';

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            "Content-Type": "application/json"
          },
          body: data
        });
      });
    }).on('error', (error) => {
      reject({
        statusCode: 500,
        body: "Error calling the external API"
      });
    });
  });
};
