var geojsonUrl = 'tunnelit.geojson';
var anotherGeojsonUrl = 'sillat.geojson';
var thirdGeojsonUrl = 'tasoristeykset.geojson';
var SAGeojsonUrl = 'SA.geojson';
var VKGeojsonUrl = 'VK.geojson';

var globalGeoJsonData;
var globalAnotherGeoJsonData;
var globalThirdGeoJsonData;
var globalsageoJsonData;
var globalvkGeoJsonData;

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
    iconAnchor: [17, 20], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

var SAIcon = L.icon({
    className: 'SA-haku',
    iconUrl: 'SA1.png', // Syöttöasemille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [17, 20], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

var VKIcon = L.icon({
    className: 'VK-haku',
    iconUrl: 'VK1.png', // Välikytkinasemille
    iconSize: [36, 36], // Kuvan koko pikseleinä
    iconAnchor: [17, 20], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
    tooltipAnchor: [1, -10]
});

function getIconForFeature(feature) {
    if (feature.properties) {
        if (feature.properties.type === 'silta') {
            return bridgeIcon;
        } else if (feature.properties.type === 'SA') {
            return SAIcon;
        } else if (feature.properties.type === 'VK') {
            return VKIcon;
        }
    }
    return customIcon;
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
                pointToLayer: function(feature, latlng) {
                    var icon = getIconForFeature(feature);
                    return L.marker(latlng, {icon: icon});
                }
            }).addTo(map);
            map.fitBounds(currentLayer.getBounds());
            isSearchActive = true;
            showCloseIcon();
        } else {
            console.error('Ei hakutuloksia.');
        }
    } else {
        console.error('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        naytaVirheilmoitus('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        showMagnifierIcon();
    }
}

document.getElementById('searchInput').addEventListener('input', function() {
    var searchTerm = this.value.trim();
    var resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Näytä "km: [syöte]" -ehdotus, jos hakutermissä on vain numeroita tai numeroita plus-merkillä
    if (searchTerm.length > 0) {
        if (!isNaN(searchTerm) || searchTerm.match(/^\d+\+\d+$/)) {
            var kmSuggestion = document.createElement('div');
            kmSuggestion.className = 'resultItem';
            kmSuggestion.innerHTML = `<strong>km: </strong> ${searchTerm}`;
            kmSuggestion.addEventListener('click', function() {
                haeRatakilometrinSijainnit(searchTerm);
            });
            resultsDiv.appendChild(kmSuggestion);
        }

        // Lisää ehdotus ratakilometrivälille
        if (searchTerm.match(/^\d+(\+\d+)?-\d+(\+\d+)?$/)) {
            var kmValiSuggestion = document.createElement('div');
            kmValiSuggestion.className = 'resultItem';
            kmValiSuggestion.innerHTML = `<strong>km: </strong> ${searchTerm}`;
            kmValiSuggestion.addEventListener('click', function() {
                haeRatakilometriValinSijainnit(searchTerm);
            });
            resultsDiv.appendChild(kmValiSuggestion);
        }

        resultsDiv.style.display = 'block';

        if (globalGeoJsonData) {
            var filteredData = globalGeoJsonData.features.filter(function(feature) {
                return feature.properties.nimi.toLowerCase().includes(searchTerm.toLowerCase());
            });
			displaySearchResults(filteredData);

            if (filteredData.length > 0) {
                filteredData.forEach(function(feature) {
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
            }
        }
    } else {
        resultsDiv.style.display = 'none';
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
                    pointToLayer: function(feature, latlng) {
                        var icon = getIconForFeature(feature);
                        return L.marker(latlng, { icon: icon });
                    },
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
