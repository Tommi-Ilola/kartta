var geojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.7/tunnelit.geojson?';
var anotherGeojsonUrl = 'https://rata.digitraffic.fi/infra-api/0.7/sillat.geojson?time=2024-02-22T06%3A53%3A28Z%2F2024-02-22T06%3A53%3A28Z';
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

// Funktio GeoJSON-datan lataamiseen
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
            // Voit yhdistää datan tässä vaiheessa tai suorittaa koordinaattimuunnoksen tarvittaessa
        })
        .catch(error => console.error('Virhe ladattaessa toista GeoJSON-tiedostoa:', error));
}

// Kutsu molempia funktioita ladataksesi datan
loadGeoJsonData();
loadAnotherGeoJsonData();

function combineAllGeoJsonData() {
    if (globalGeoJsonData && globalAnotherGeoJsonData && globalThirdGeoJsonData) {
        // Yhdistä kaikki features kolmesta datasetistä
        var combinedFeatures = globalGeoJsonData.features
            .concat(globalAnotherGeoJsonData.features)
            .concat(globalThirdGeoJsonData.features);
        globalGeoJsonData.features = combinedFeatures;
        console.log('Kaikki GeoJSON datasetit yhdistetty:', globalGeoJsonData);
        // Tässä voit suorittaa muita toimenpiteitä yhdistetyn datan kanssa
    }
}

// Kutsu combineGeoJsonData-funktiota sen jälkeen, kun molemmat datasetit on ladattu


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
    }).catch(error => {
        console.error('Virhe ladattaessa GeoJSON-tietoja:', error);
    });
}

loadAllGeoJsonData();

    var customIcon = L.icon({
	  className: 'tasoristeys-haku',
      iconUrl: 'tasoristeys1.png', // Markerin kuvatiedoston polku
      iconSize: [36, 36], // Kuvan koko pikseleinä
      iconAnchor: [20, 17], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
      tooltipAnchor: [1, -10]
    });
		
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
                    // Tässä käytetään L.marker kustomoidun ikonin kanssa jokaiselle hakutulokselle
                    return L.marker(latlng, {icon: customIcon});
                }
            }).addTo(map);
            map.fitBounds(currentLayer.getBounds());
            isSearchActive = true;
            showCloseIcon();
        } else {
		
        }
    } else {
        console.error('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        naytaVirheilmoitus('Hakukenttä on tyhjä tai dataa ei ole vielä ladattu.');
        showMagnifierIcon();
    }
}

// Funktiot määritellään ensin
function style(feature) {
    if (feature.geometry.type === 'MultiLineString') {
		return {
			color: "blue", // Sininen sisäväri
			weight: 8,
			opacity: 1
		};
    }
}

    // Käy läpi GeoJSON-datan etsien vastaavuutta
	function convertCoordinates(feature) {
		if (feature.geometry.type === 'MultiLineString') {
			feature.geometry.coordinates = feature.geometry.coordinates.map(line => 
				line.map(point => proj4(sourceProjection, destinationProjection, point))
			);
		} else if (feature.geometry.type === 'MultiPoint') {
			feature.geometry.coordinates = feature.geometry.coordinates.map(point => 
				proj4(sourceProjection, destinationProjection, point)
			);
		}
		// Lisää tähän käsittely muille geometriatyypeille, kuten 'Point', 'Polygon', jne.
	}

Promise.all([
    fetch(geojsonUrl).then(response => response.json()),
    fetch(anotherGeojsonUrl).then(response => response.json()),
    fetch(thirdGeojsonUrl).then(response => response.json())
]).then(datas => {
    // Yhdistetään kaikki ladatut datasetit yhteen FeatureCollectioniin
    var combinedGeoJsonData = {
        type: "FeatureCollection",
        features: [].concat(...datas.map(data => data.features))
    };

    // Suoritetaan koordinaattimuunnokset
    combinedGeoJsonData.features.forEach(convertCoordinates);

    // Piirretään yhdistetty data kartalle
    globalGeoJsonData = combinedGeoJsonData;

}).catch(error => {
    console.error('Virhe ladattaessa GeoJSON-tietoja:', error);
});

function drawGeoJsonOnMap(geoJsonData) {
    // Poistetaan aikaisemmat hakutulokset kartalta
    if (window.searchResultsLayer) {
        map.removeLayer(window.searchResultsLayer);
    }

    // Piirretään hakutulokset kartalle
    window.searchResultsLayer = L.geoJSON(geoJsonData, {
        onEachFeature: onEachFeature,
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: 'tasoristeys.png', // Osoita oikea polku ikonitiedostoosi
					iconSize: [30, 30], // Kuvan koko pikseleinä
					iconAnchor: [17, 14], // Kuvan ankkuripiste, joka vastaa markerin sijaintia kartalla
					tooltipAnchor: [1, -10], // Popup-ikkunan sijainti suhteessa markerin ankkuriin
                })
            });
        },
		style: style
    }).addTo(map);
	

	L.geoJSON(geoJsonData, {
		style: function(feature) {
			if (feature.geometry.type === 'MultiLineString') {
				return {
					color: "#00a8f3", // Sininen sisäväri
					weight: 3,
					opacity: 0
				};
			}
		},
		pointToLayer: pointToLayer
	}).addTo(map);

// Funktio, joka ajetaan jokaiselle featurelle, kun se lisätään kartalle
function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.nimi) {
        layer.bindTooltip(feature.properties.nimi, {
            permanent: false, // Tooltip näkyy vain, kun hiiri on elementin päällä
            direction: 'auto', // Tooltipin suunta määräytyy automaattisesti
            className: 'custom-tooltip' // Voit määritellä custom-luokan CSS-tyylien käyttöä varten
        });
    }
}

L.geoJSON(geoJsonData, {
    onEachFeature: onEachFeature,
    pointToLayer: pointToLayer, // Jos käytät custom pointToLayer-funktiota
    style: style // Jos määrittelet tyylejä
}).addTo(map);

    if (geoJsonData.features.length > 0) {
        map.fitBounds(window.searchResultsLayer.getBounds());
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

var currentLayer; // Määritellään currentLayer globaalilla tasolla

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
                    map.removeLayer(currentLayer); // Poista aiempi kerros, jos sellainen on
                }

                currentLayer = L.geoJSON(feature, {
                    pointToLayer: function(feature, latlng) {
                        return L.marker(latlng, {icon: customIcon});
                    },
                    style: function(feature) {
                        // Tässä esimerkissä oletetaan, että käytät samaa tyyliä kaikille featureille
                        return {
                            color: "blue",
                            weight: 8,
                            opacity: 1
                        };
                    }
                }).addTo(map);

                // Kohdista kartta valitun kohteen mukaan
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
