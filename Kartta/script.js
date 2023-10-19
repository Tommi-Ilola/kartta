proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");

// Aloita Leaflet-kartta ja aseta näkymä
const map = L.map('map').setView([60.1695, 24.9354], 13);  // Tämä keskittää kartan Helsinkiin. Muuta koordinaatteja tarpeen mukaan.

// Lisää karttatason tiilet
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Hae JSON-data
fetch('rautatiet.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Original data:', data);
        
        // Käy läpi jokainen kohta data.features
        data.features.forEach(function(feature) {
            // Tarkista, että geometry on olemassa ennen coordinates käsittelyä
            if (feature.geometry) {
                const coords = feature.geometry.coordinates;
                // Muuta EPSG:3067 koordinaatit latlng koordinaateiksi ja lisää ne karttaan
                const latlng = proj4('EPSG:3067', 'WGS84', coords);
                L.marker([latlng[1], latlng[0]]).addTo(map);
            }
        });
    })
    .catch(error => {
        console.error('There was a problem:', error);
    });
	