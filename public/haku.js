var geojsonUrl = 'tunnelit.geojson';
var anotherGeojsonUrl = 'sillat.geojson';
var thirdGeojsonUrl = 'tasoristeykset.geojson';

var SAGeojsonUrl = 'SA.geojson';
var VKGeojsonUrl = 'VK.geojson';

var globalGeoJsonData = {
    type: "FeatureCollection",
    features: []
};

var sourceProjection = proj4.defs("EPSG:3067");
var destinationProjection = proj4.defs("EPSG:4326"); // WGS 84

function loadGeoJsonData(url, type, callback) {
    fetch(url)
        .then(response => response.json())
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
                    return L.marker(latlng, { icon: icon });
                },
                onEachFeature: onEachFeature
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
            kmSuggestion.innerHTML = `<strong>km:&nbsp;</strong> ${searchTerm}`;
            kmSuggestion.addEventListener('click', function() {
                haeRatakilometrinSijainnit(searchTerm);
            });
            resultsDiv.appendChild(kmSuggestion);
        }

        // Lisää ehdotus ratakilometrivälille
        if (searchTerm.match(/^\d+(\+\d+)?-\d+(\+\d+)?$/)) {
            var kmValiSuggestion = document.createElement('div');
            kmValiSuggestion.className = 'resultItem';
            kmValiSuggestion.innerHTML = `<strong>km:&nbsp;</strong> ${searchTerm}`;
            kmValiSuggestion.addEventListener('click', function() {
                haeRatakilometriValinSijainnit(searchTerm);
            });
            resultsDiv.appendChild(kmValiSuggestion);
        }

        resultsDiv.style.display = 'block';

        if (globalGeoJsonData) {
            var filteredData = globalGeoJsonData.features.filter(function(feature) {
                return feature.properties.nimi && feature.properties.nimi.toLowerCase().includes(searchTerm.toLowerCase());
            });

            if (filteredData.length > 0) {
				displaySearchResults(filteredData);
                filteredData.forEach(function(feature) {
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
                            },
                            onEachFeature: onEachFeature
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

        // Ryhmittele hakutulokset tyypin mukaan
        var groupedResults = features.reduce((acc, feature) => {
            const type = feature.properties.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(feature);
            return acc;
        }, {});

        // Luo ryhmätulokset ja lisää ne resultsDiv-elementtiin
        for (const [type, features] of Object.entries(groupedResults)) {
            var groupHeader = document.createElement('div');
            groupHeader.className = 'groupHeader';
            groupHeader.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            resultsDiv.appendChild(groupHeader);

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
                                color: "#5eff00",
                                weight: 8,
                                opacity: 1
                            };
                        },
                        onEachFeature: onEachFeature
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
        }
    } else {
        resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
        isSearchActive = false;
    }
}

function style(feature) {
    if (feature.geometry.type === 'MultiLineString') {
        return {
            color: "#5eff00",
            weight: 8,
            opacity: 1
        };
    }
}

function convertCoordinates(feature) {
    if (feature.geometry.type === 'MultiLineString') {
        feature.geometry.coordinates = feature.geometry.coordinates.map(line =>
            line.map(point => proj4(sourceProjection, destinationProjection, point))
        );
    } else if (feature.geometry.type === 'MultiPoint' || feature.geometry.type === 'Point') {
        feature.geometry.coordinates = feature.geometry.coordinates.map(point =>
            Array.isArray(point) && point.length === 2 && typeof point[0] === 'number' && typeof point[1] === 'number'
                ? proj4(sourceProjection, destinationProjection, point)
                : point
        );
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
        features: [].concat(...datas.map((data, index) => {
            const types = ['tunneli', 'silta', 'tasoristeys', 'SA', 'VK'];
            data.features.forEach(feature => {
                feature.properties.type = types[index];
            });
            return data.features;
        }))
    };

    combinedGeoJsonData.features.forEach(feature => {
        if (feature.properties.type !== 'tasoristeys') {
            convertCoordinates(feature);
        }
    });

    globalGeoJsonData = combinedGeoJsonData;
    console.log('Kaikki GeoJSON datasetit yhdistetty ja muunnettu:', globalGeoJsonData);
}).catch(error => {
    console.error('Virhe ladattaessa GeoJSON-tietoja:', error);
});

function drawGeoJsonOnMap(geoJsonData) {
    if (window.searchResultsLayer) {
        map.removeLayer(window.searchResultsLayer);
    }

    window.searchResultsLayer = L.geoJSON(geoJsonData, {
        onEachFeature: onEachFeature,
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: getIconForFeature(feature)
            });
        },
        style: style
    }).addTo(map);

    if (geoJsonData.features.length > 0) {
        map.fitBounds(window.searchResultsLayer.getBounds());
    }
}

function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.nimi) {
        var tooltipContent = feature.properties.nimi;
        var popupContent = '';
        const coords = feature.geometry.type === 'MultiLineString' ? feature.geometry.coordinates[0][0] : feature.geometry.coordinates;

        switch (feature.properties.type) {
            case 'tunneli':
				popupContent += `<b><strong>Tunneli</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}`;
                if (feature.properties.ratakmvalit && feature.properties.ratakmvalit.length > 0) {
                    var ratakmvalit = feature.properties.ratakmvalit[0];
                    popupContent += `<br><strong>Ratanumero:</strong> ${ratakmvalit.ratanumero}
                                     <br><strong>Ratakm alku:</strong> ${ratakmvalit.alku.ratakm}+${ratakmvalit.alku.etaisyys} - ${ratakmvalit.loppu.ratakm}+${ratakmvalit.loppu.etaisyys}`;
                }
                popupContent += `<br><a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'silta':
				popupContent += `<b><strong>Silta</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <b>Tunnus:</b> ${feature.properties['Tunnus']}<br>
                                <b>Väylänpito:</b> ${feature.properties.Väylänpito}<br>
                                <b>Ratanumero:</b> ${feature.properties.Ratanumero}<br>
                                <b>Ratakilometrisijainti:</b> ${feature.properties.Ratakilometrisijainti}<br>
                                <b>Tilirataosa:</b> ${feature.properties.Tilirataosa}<br>
                                <b>Kunnossapitoalue:</b> ${feature.properties.Kunnossapitoalue}<br>
                                <b>Isännöintialue:</b> ${feature.properties.Isännöintialue}<br>
                                <b>Omistaja:</b> ${feature.properties.Omistaja}<br>
                                <b>Sijaintikunta:</b> ${feature.properties.Sijaintikunnat}<br>
                                <b>Katuosoite:</b> ${feature.properties.Katuosoitteet}<br>
                                <b>Käyttötarkoitus:</b> ${feature.properties.Käyttötarkoitus}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'tasoristeys':
				popupContent += `<b><strong>Tasoristeys</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <strong>Tunnus:</strong> ${feature.properties.tunnus}<br>
                                <strong>Varoituslaitos:</strong> ${feature.properties.varoituslaitos}<br>
                                <strong>Tielaji:</strong> ${feature.properties.tielaji}<br>
                                <strong>Ratanumero:</strong> ${feature.properties.virallinenSijainti.ratanumero}<br>
                                <strong>Ratakilometrisijainti:</strong> ${feature.properties.virallinenSijainti.ratakm}+${feature.properties.virallinenSijainti.etaisyys}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'SA':
				popupContent += `<b><strong>Syöttöasema</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <b>Tunnus:</b> ${feature.properties['SyöttöasemanTunnus']}<br>
                                <b>Tyyppi:</b> ${feature.properties.Tyyppi}<br>
                                <b>Ratanumero:</b> ${feature.properties.Ratanumero}<br>
                                <b>Ratakilometrisijainti:</b> ${feature.properties.Ratakilometrisijainti}<br>
                                <b>Tilirataosa:</b> ${feature.properties.Tilirataosa}<br>
                                <b>Kunnossapitoalue:</b> ${feature.properties.Kunnossapitoalue}<br>
                                <b>Isännöintialue:</b> ${feature.properties.Isännöintialue}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'VK':
				popupContent += `<b><strong>Välikytkinasema</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <b>Tyyppi:</b> ${feature.properties.Tyyppi}<br>
                                <b>Ratanumero:</b> ${feature.properties.Ratanumero}<br>
                                <b>Ratakilometrisijainti:</b> ${feature.properties.Ratakilometrisijainti}<br>
                                <b>Tilirataosa:</b> ${feature.properties.Tilirataosa}<br>
                                <b>Kunnossapitoalue:</b> ${feature.properties.Kunnossapitoalue}<br>
                                <b>Isännöintialue:</b> ${feature.properties.Isännöintialue}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
        }

        layer.bindTooltip(tooltipContent, {
            permanent: true,
            direction: 'auto',
            className: 'custom-tooltip',
            offset: [0, -10]
        });

        layer.bindPopup(popupContent, {
            offset: L.point(0, -10)
        });
    }
}
