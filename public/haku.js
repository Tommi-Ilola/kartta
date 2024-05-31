var geojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.7/tunnelit.geojson?';
var anotherGeojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.7/sillat.geojson?time=2024-02-22T06%3A53%3A28Z%2F2024-02-22T06%3A53%3A28Z';
var thirdGeojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.8/tasoristeykset.geojson?srsName=crs%3A84&time=2024-05-24T14%3A26%3A22Z%2F2024-05-24T15%3A26%3A22Z';

var SAGeojsonUrl = 'SA.geojson';
var VKGeojsonUrl = 'VK.geojson';

var globalGeoJsonData = {
    type: "FeatureCollection",
    features: []
};

proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
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
loadGeoJsonData(geojsonUrl, 'tunnelit', data => combineAllGeoJsonData(data));
loadGeoJsonData(anotherGeojsonUrl, 'sillat', data => combineAllGeoJsonData(data));
loadGeoJsonData(thirdGeojsonUrl, 'tasoristeykset', data => combineAllGeoJsonData(data));
loadGeoJsonData(SAGeojsonUrl, 'Syöttöasemat', data => combineAllGeoJsonData(data));
loadGeoJsonData(VKGeojsonUrl, 'Välikytkinasemat', data => combineAllGeoJsonData(data));

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
            case 'sillat':
                return bridgeIcon;
            case 'Syöttöasemat':
                return SAIcon;
            case 'Välikytkinasemat':
                return VKIcon;
            case 'tunnelit':
                return customIcon;
            case 'tasoristeykset':
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
    var kmDiv = document.getElementById('km');
    var resultsDiv = document.getElementById('results');
    kmDiv.innerHTML = '';
    resultsDiv.innerHTML = '';

    // Näytä "km: [syöte]" -ehdotus, jos hakutermissä on vain numeroita tai numeroita plus-merkillä
    if (searchTerm.length > 0) {
        if (!isNaN(searchTerm) || searchTerm.match(/^\d+\+\d+$/)) {
            var kmSuggestion = document.createElement('div');
            kmSuggestion.className = 'kmItem';
            kmSuggestion.innerHTML = `<strong>km:&nbsp;</strong> ${searchTerm}`;
            kmSuggestion.addEventListener('click', function() {
                haeRatakilometrinSijainnit(searchTerm);
            });
            kmDiv.appendChild(kmSuggestion);
        }

        // Lisää ehdotus ratakilometrivälille
        if (searchTerm.match(/^\d+(\+\d+)?-\d+(\+\d+)?$/)) {
            var kmValiSuggestion = document.createElement('div');
            kmValiSuggestion.className = 'kmItem';
            kmValiSuggestion.innerHTML = `<strong>km:&nbsp;</strong> ${searchTerm}`;
            kmValiSuggestion.addEventListener('click', function() {
                haeRatakilometriValinSijainnit(searchTerm);
            });
            kmDiv.appendChild(kmValiSuggestion);
        }

        if (globalGeoJsonData) {
            var filteredData = globalGeoJsonData.features.filter(function(feature) {
                return feature.properties.nimi && feature.properties.nimi.toLowerCase().includes(searchTerm.toLowerCase());
            });

            if (filteredData.length > 0) {
                displaySearchResults(filteredData);
                showCloseIcon();
            }
        }

        kmDiv.style.display = 'block';
        resultsDiv.style.display = 'block';
    } else {
        kmDiv.style.display = 'none';
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
        }
    } else {
        resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
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
            const types = ['tunnelit', 'sillat', 'tasoristeykset', 'Syöttöasemat', 'Välikytkinasemat'];
            data.features.forEach(feature => {
                feature.properties.type = types[index];
            });
            return data.features;
        }))
    };

    combinedGeoJsonData.features.forEach(feature => {
        if (feature.properties.type !== 'tasoristeykset') {
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
            case 'tunnelit':
				popupContent += `<b><strong>Tunneli</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}`;
                if (feature.properties.ratakmvalit && feature.properties.ratakmvalit.length > 0) {
                    var ratakmvalit = feature.properties.ratakmvalit[0];
                    popupContent += `<br><strong>Ratanumero:</strong> ${ratakmvalit.ratanumero}
                                     <br><strong>Ratakm alku:</strong> ${ratakmvalit.alku.ratakm}+${ratakmvalit.alku.etaisyys} - ${ratakmvalit.loppu.ratakm}+${ratakmvalit.loppu.etaisyys}`;
                }
                popupContent += `<br><a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'sillat':
				popupContent += `<b><strong>Silta</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <strong>Tunnus:</strong> ${feature.properties['Tunnus']}<br>
                                <strong>Väylänpito:</strong> ${feature.properties.Väylänpito}<br>
                                <strong>Ratanumero:</strong> ${feature.properties.Ratanumero}<br>
                                <strong>Ratakilometrisijainti:</strong> ${feature.properties.Ratakilometrisijainti}<br>
                                <strong>Tilirataosa:</strong> ${feature.properties.Tilirataosa}<br>
                                <strong>Kunnossapitoalue:</strong> ${feature.properties.Kunnossapitoalue}<br>
                                <strong>Isännöintialue:</strong> ${feature.properties.Isännöintialue}<br>
                                <strong>Omistaja:</strong> ${feature.properties.Omistaja}<br>
                                <strong>Sijaintikunta:</strong> ${feature.properties.Sijaintikunnat}<br>
                                <strong>Katuosoite:</strong> ${feature.properties.Katuosoitteet}<br>
                                <strong>Käyttötarkoitus:</strong> ${feature.properties.Käyttötarkoitus}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'tasoristeykset':
				popupContent += `<b><strong>Tasoristeys</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <strong>Tunnus:</strong> ${feature.properties.tunnus}<br>
                                <strong>Varoituslaitos:</strong> ${feature.properties.varoituslaitos}<br>
                                <strong>Tielaji:</strong> ${feature.properties.tielaji}<br>
                                <strong>Ratanumero:</strong> ${feature.properties.virallinenSijainti.ratanumero}<br>
                                <strong>Ratakilometrisijainti:</strong> ${feature.properties.virallinenSijainti.ratakm}+${feature.properties.virallinenSijainti.etaisyys}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'Syöttöasemat':
				popupContent += `<b><strong>Syöttöasema</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <strong>Tunnus:</strong> ${feature.properties['SyöttöasemanTunnus']}<br>
                                <strong>Tyyppi:</strong> ${feature.properties.Tyyppi}<br>
                                <strong>Ratanumero:</strong> ${feature.properties.Ratanumero}<br>
                                <strong>Ratakilometrisijainti:</strong> ${feature.properties.Ratakilometrisijainti}<br>
                                <strong>Tilirataosa:</strong> ${feature.properties.Tilirataosa}<br>
                                <strong>Kunnossapitoalue:</strong> ${feature.properties.Kunnossapitoalue}<br>
                                <strong><strong>Isännöintialue:</strong> ${feature.properties.Isännöintialue}<br>
                                <a href="https://www.google.com/maps/?q=${coords[1]},${coords[0]}" target="_blank">Näytä Google Mapsissa</a>`;
                break;
            case 'Välikytkinasemat':
				popupContent += `<b><strong>Välikytkinasema</strong></b><br>`;
                popupContent += `<strong>Nimi:</strong> ${feature.properties.nimi}<br>
                                <strong>Tyyppi:</strong> ${feature.properties.Tyyppi}<br>
                                <strong>Ratanumero:</strong> ${feature.properties.Ratanumero}<br>
                                <strong>Ratakilometrisijainti:</strong> ${feature.properties.Ratakilometrisijainti}<br>
                                <strong>Tilirataosa:</strong> ${feature.properties.Tilirataosa}<br>
                                <strong>Kunnossapitoalue:</strong> ${feature.properties.Kunnossapitoalue}<br>
                                <strong>Isännöintialue:</strong> ${feature.properties.Isännöintialue}<br>
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

