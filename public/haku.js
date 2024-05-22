var geojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.7/tunnelit.geojson?';
var anotherGeojsonUrl = 'sillat.geojson';
var thirdGeojsonUrl = 'tasoristeykset.geojson';
var globalGeoJsonData;
var globalAnotherGeoJsonData;
var globalThirdGeoJsonData;

// Määritä projektiot
proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
var sourceProjection = proj4.defs("EPSG:3067");
var destinationProjection = proj4.defs("EPSG:4326"); // WGS 84

// Muunna koordinaatit
var point = [381586.25, 6681171.85]; // Esimerkkikoordinaatit EPSG:3067:ssä
var convertedPoint = proj4(sourceProjection, destinationProjection, point);

console.log(convertedPoint); // Tulostaa muunnetut koordinaatit EPSG:4326:ssa

function loadGeoJsonData() {
    fetch(geojsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Verkkovirhe ladattaessa GeoJSON-tiedostoa: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            globalGeoJsonData = data;
            console.log('GeoJSON data ladattu:', globalGeoJsonData);
        })
        .catch(error => {
            console.error('Virhe ladattaessa GeoJSON-tiedostoa:', error);
        });
}

loadGeoJsonData();

function loadAnotherGeoJsonData() {
    fetch(anotherGeojsonUrl)
        .then(response => response.json())
        .then(data => {
            globalAnotherGeoJsonData = data;
            console.log('Toinen GeoJSON data ladattu:', globalAnotherGeoJsonData);
        })
        .catch(error => console.error('Virhe ladattaessa toista GeoJSON-tiedostoa:', error));
}

loadAnotherGeoJsonData();

function combineAllGeoJsonData() {
    if (globalGeoJsonData && globalAnotherGeoJsonData && globalThirdGeoJsonData) {
        var combinedFeatures = globalGeoJsonData.features
            .concat(globalAnotherGeoJsonData.features)
            .concat(globalThirdGeoJsonData.features);
        globalGeoJsonData.features = combinedFeatures;
        console.log('Kaikki GeoJSON datasetit yhdistetty:', globalGeoJsonData);
    }
}

function loadAllGeoJsonData() {
    Promise.all([
        fetch(geojsonUrl).then(response => response.json()),
        fetch(anotherGeojsonUrl).then(response => response.json()),
        fetch(thirdGeojsonUrl).then(response => response.json())
    ]).then(datas => {
        globalGeoJsonData = {
            type: "FeatureCollection",
            features: [].concat(...datas.map(data => data.features))
        };
        console.log('Kaikki GeoJSON datasetit ladattu:', globalGeoJsonData);
    }).catch(error => {
        console.error('Virhe ladattaessa GeoJSON-tietoja:', error);
    });
}

loadAllGeoJsonData();

var siltaIcon = L.icon({
    iconUrl: 'silta.png',
    iconSize: [36, 36],
    iconAnchor: [20, 17],
    tooltipAnchor: [1, -10]
});

var tasoristeysIcon = L.icon({
    className: 'tasoristeys-haku',
    iconUrl: 'tasoristeys1.png',
    iconSize: [36, 36],
    iconAnchor: [20, 17],
    tooltipAnchor: [1, -10]
});

function pointToLayer(feature, latlng) {
    let icon;
    if (feature.properties.tyyppi === 'silta') {
        icon = siltaIcon;
    } else {
        icon = tasoristeysIcon;
    }
    return L.marker(latlng, { icon: icon });
}

function style(feature) {
    if (feature.geometry.type === 'MultiLineString') {
        return {
            color: "blue",
            weight: 8,
            opacity: 1
        };
    }
}

function drawGeoJsonOnMap(geoJsonData) {
    if (window.searchResultsLayer) {
        map.removeLayer(window.searchResultsLayer);
    }

    window.searchResultsLayer = L.geoJSON(geoJsonData, {
        onEachFeature: onEachFeature,
        pointToLayer: pointToLayer,
        style: style
    }).addTo(map);

    if (geoJsonData.features.length > 0) {
        map.fitBounds(window.searchResultsLayer.getBounds());
    }
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.nimi) {
        layer.bindTooltip(feature.properties.nimi, {
            permanent: false,
            direction: 'auto',
            className: 'custom-tooltip'
        });
    }
}

document.getElementById('searchInput').addEventListener('input', function() {
    var searchTerm = this.value.toLowerCase();
    if (searchTerm.length > 0) {
        var filteredData = globalGeoJsonData.features.filter(function(feature) {
            return feature.properties.nimi.toLowerCase().includes(searchTerm);
        });
        displaySearchResults(filteredData);
        piilotaVirheilmoitus();
    } else {
        document.getElementById('results').style.display = 'none';
    }
});

var currentLayer;

function displaySearchResults(features) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (features.length > 0) {
        resultsDiv.style.display = 'block';

        features.forEach(function(feature) {
            var resultItem = document.createElement('div');
            resultItem.className = 'resultItem';
            resultItem.textContent = feature.properties.nimi;

            resultItem.addEventListener('click', function() {
                if (currentLayer) {
                    map.removeLayer(currentLayer);
                }

                currentLayer = L.geoJSON(feature, {
                    pointToLayer: pointToLayer,
                    style: function(feature) {
                        return {
                            color: "blue",
                            weight: 8,
                            opacity: 1
                        };
                    }
                }).addTo(map);

                if (feature.geometry.type === 'Point') {
                    var latLng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                    map.setView(latLng, 12);
                } else {
                    map.fitBounds(currentLayer.getBounds(), {
                        maxZoom: 12
                    });
                }
            });
            resultsDiv.appendChild(resultItem);
        });
        isSearchActive = true;
        showCloseIcon();
    } else {
        resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
        isSearchActive = false;
    }
}

function searchLocation(searchTerm) {
    var searchTerm = document.getElementById('searchInput').value.trim();

    if (searchTerm.length > 0 && globalGeoJsonData) {
        var filteredData = {
            type: "FeatureCollection",
            features: globalGeoJsonData.features.filter(function(feature) {
                return feature.properties.nimi.toLowerCase().includes(searchTerm.toLowerCase());
            })
        };

        if (filteredData.features.length > 0) {
            if (currentLayer) map.removeLayer(currentLayer);
            currentLayer = L.geoJSON(filteredData, {
                pointToLayer: pointToLayer,
                style: style
            }).addTo(map);
            map.fitBounds(currentLayer.getBounds());
            isSearchActive = true;
            showCloseIcon();
        } else {
            console.error('Ei hakutuloksia hakusanalla: ' + searchTerm);
            naytaVirheilmoitus('Ei hakutuloksia hakusanalla: ' + searchTerm);
        }
    } else {
        console.error('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        naytaVirheilmoitus('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        showMagnifierIcon();
    }
}
