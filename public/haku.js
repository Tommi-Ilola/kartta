var geojsonUrl = 'tunnelit.geojson';
var anotherGeojsonUrl = 'sillat.geojson';
var thirdGeojsonUrl = 'tasoristeykset.geojson';

var SAGeojsonUrl = 'SA.geojson';
var VKGeojsonUrl = 'VK.geojson';

var globalGeoJsonData = {
    type: "FeatureCollection",
    features: []
};

// Määritä projektiot
proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
var sourceProjection = proj4.defs("EPSG:3067");
var destinationProjection = proj4.defs("EPSG:4326"); // WGS 84

function loadGeoJsonData(url, type, callback) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Verkkovirhe ladattaessa GeoJSON-tiedostoa: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (type) {
                data.features.forEach(feature => {
                    feature.properties.type = type;
                });
            }
            callback(data);
        })
        .catch(error => {
            console.error('Virhe ladattaessa GeoJSON-tiedostoa:', error);
        });
}

function combineAllGeoJsonData(data) {
    globalGeoJsonData.features = globalGeoJsonData.features.concat(data.features);
    console.log('Kaikki GeoJSON datasetit yhdistetty:', globalGeoJsonData);
}

// Lataa GeoJSON-data ja lisää `type`-ominaisuus
loadGeoJsonData(geojsonUrl, 'tunneli', data => combineAllGeoJsonData(data));
loadGeoJsonData(anotherGeojsonUrl, 'silta', data => combineAllGeoJsonData(data));
loadGeoJsonData(thirdGeojsonUrl, 'tasoristeys', data => combineAllGeoJsonData(data));
loadGeoJsonData(SAGeojsonUrl, 'SA', data => combineAllGeoJsonData(data));
loadGeoJsonData(VKGeojsonUrl, 'VK', data => combineAllGeoJsonData(data));

var customIcon = L.icon({
    className: 'tasoristeys-haku',
    iconUrl: 'tasoristeys1.png', // Tasoristeyksille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [20, 17], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

var bridgeIcon = L.icon({
    className: 'silta-haku',
    iconUrl: 'silta1.png', // Silloille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [20, 17], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

var SAIcon = L.icon({
    className: 'SA-haku',
    iconUrl: 'SA1.png', // Rampeille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [20, 17], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

var VKIcon = L.icon({
    className: 'VK-haku',
    iconUrl: 'VK1.png', // Alituksille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [20, 17], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

function getIconForFeature(feature) {
    if (feature.properties && feature.properties.type) {
        switch (feature.properties.type) {
            case 'silta':
                return bridgeIcon;
            case 'SA':
                return SAIcon;
            case 'VK':
                return VKIcon;
            case 'tunneli':
                return customIcon;
            case 'tasoristeys':
                return customIcon;
            default:
                return customIcon;
        }
    }
    return customIcon;
}

function convertCoordinates(feature) {
    if (feature.geometry.type === 'MultiLineString') {
        feature.geometry.coordinates = feature.geometry.coordinates.map(line =>
            line.map(point => proj4(sourceProjection, destinationProjection, point))
        );
    } else if (feature.geometry.type === 'MultiPoint') {
        feature.geometry.coordinates = feature.geometry.coordinates.map(point =>
            proj4(sourceProjection, destinationProjection, point)
        );
    } else if (feature.geometry.type === 'Point') {
        feature.geometry.coordinates = proj4(sourceProjection, destinationProjection, feature.geometry.coordinates);
    }
}

Promise.all([
    fetch(geojsonUrl).then(response => response.json()),
    fetch(anotherGeojsonUrl).then(response => response.json()),
    fetch(thirdGeojsonUrl).then(response => response.json()),
    fetch(SAGeojsonUrl).then(response => response.json()),
    fetch(VKGeojsonUrl).then(response => response.json())
]).then(datas => {
    var combinedGeoJsonData = {
        type: "FeatureCollection",
        features: [].concat(...datas.map(data => {
            data.features.forEach(feature => {
                if (data === datas[0]) feature.properties.type = 'tunneli';
                if (data === datas[1]) feature.properties.type = 'silta';
                if (data === datas[2]) feature.properties.type = 'tasoristeys';
                if (data === datas[3]) feature.properties.type = 'SA';
                if (data === datas[4]) feature.properties.type = 'VK';
            });
            return data.features;
        }))
    };

    combinedGeoJsonData.features.forEach(convertCoordinates);

    globalGeoJsonData = combinedGeoJsonData;
    console.log('Kaikki GeoJSON datasetit yhdistetty ja muunnettu:', globalGeoJsonData);
}).catch(error => {
    console.error('Virhe ladattaessa GeoJSON-tietoja:', error);
});
