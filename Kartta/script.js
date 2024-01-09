function verifyPassword() {
	var password = prompt("Anna salasana päästäksesi sivulle:");
	if (password == "ratakilometri") {
		// Salasana oikein, näytä sisältö
		document.getElementById("map").style.display = "block";
			map.invalidateSize();		
		document.getElementById("protected-content").style.display = "block";
		// Pyydä Leafletiä päivittämään kartan koko
		setTimeout(function() {
			map.invalidateSize();
		}, 400);
	} else {
		// Salasana väärin, ilmoita käyttäjälle
		alert("Väärä salasana!");
	}
}

// Määritellään projektiotiedot
proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");

// Oletetaan, että nämä ovat alkuperäiset koordinaatit ja zoomaus desktop-laitteille
let defaultCoords = [62.070149, 26.232580];
let defaultZoom = 7;

// Määritellään toiset koordinaatit ja zoomaus mobiililaitteille
let mobileCoords = [64.915565, 26.484516]; // Esimerkiksi toiset koordinaatit
let mobileZoom = 6; // Esimerkiksi pienempi zoomaustaso

// Funktio laitetunnistukseen
function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

// Tarkistetaan, onko laite mobiililaite
let map;  // Alustetaan ensin muuttuja
if (isMobileDevice()) {
    map = L.map('map').setView(mobileCoords, mobileZoom);
} else {
    map = L.map('map').setView(defaultCoords, defaultZoom);
}

// Karttanäkymä (OSM)
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Satelliittinäkymä (esim. Esri:n satelliittikuvat, jotka ovat ilmaisia ja julkisia)
var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 25,
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Painikkeen toiminnallisuus
document.getElementById('toggleView').addEventListener('click', function() {
    if (map.hasLayer(osmLayer)) {
        map.removeLayer(osmLayer);
        satelliteLayer.addTo(map);
    } else {
        map.removeLayer(satelliteLayer);
        osmLayer.addTo(map);
    }
});

let allMarkers = [];
let currentCity = ""; // Määritetään ulkoinen muuttuja kaupungin nimelle

function getCityFromCoordinates(lat, lon, callback) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            let foundCity = null;
            if (data && data.address) {
                foundCity = data.address.city || data.address.town;
            }
            callback(foundCity);
        })
        .catch(error => {
            console.error("Error fetching city:", error);
            callback(null);
        });
}

function resetMarkerStyles() {
    allMarkers.forEach(marker => {
        marker.setStyle({
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
			radius: 3
        });
    });
}

function parseRatakmValue(value) {
    const parts = value.split("+");
    if (parts.length == 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 1000;
    } else {
        return parseFloat(value);
    }
}

function highlightMarker(marker) {
	resetMarkerStyles(); // Palautetaan ensin muiden markerien värit

    // Korostetaan valittu marker
    marker.setStyle({
        color: '#333',
        fillColor: 'blue',
        fillOpacity: 0.8,
		radius: 5
    });
	
    marker.bringToFront();
    map.setView(marker.getLatLng(), 11); // Keskitytään markeriin ja zoomataan lähemmäs
}


function showMarkersByRatakm(ratakmValue) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resetMarkerStyles();

    allMarkers.forEach(marker => {
        const featureProps = marker.featureProperties;
        const parsedRatakm = parseRatakmValue(featureProps.ratakm.toString());

        if (parsedRatakm === ratakmValue) {
            // Hae kaupunki tälle markerille
            const lat = marker.getLatLng().lat;
            const lon = marker.getLatLng().lng;
            
            getCityFromCoordinates(lat, lon, (city) => {
                if (!city) {
                    console.log("Couldn't determine the city");
                    return;
                }

                marker.setStyle({
                    color: '#333',
                    fillColor: 'blue',
                    fillOpacity: 0.8,
                    radius: 3
                });

                marker.bringToFront();

                const resultItem = document.createElement('div');
                resultItem.className = 'resultItem';

                resultItem.innerHTML = `
					<strong>Kaupunki:</strong> ${city}<br>
                    <strong>Ratakm:</strong> ${featureProps.ratakm}<br>
                    <strong>Ratanumero:</strong> ${featureProps.ratanumero || 'Ei määritelty'}
                `;

                resultItem.addEventListener('click', function() {
                    highlightMarker(marker);
                });

                resultsDiv.appendChild(resultItem);
            });
        }
    });

    document.getElementById('results').style.display = 'block';
}

function showCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>';
}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier-icon">&#x1F50E;&#xFE0E;</span>';
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    resetMarkerStyles();
    document.getElementById('results').style.display = 'none';
    showMagnifierIcon();
}

document.getElementById('searchButton').addEventListener('click', function() {
    if (document.getElementById('results').style.display === 'block') {
        resetSearch();
    } else {
        const searchValue = parseRatakmValue(document.getElementById('searchInput').value);
        showMarkersByRatakm(searchValue);
        showCloseIcon();
    }
});

document.getElementById('searchInput').addEventListener('keyup', function(event) {
    if (event.keyCode === 13) {
        const searchValue = parseRatakmValue(document.getElementById('searchInput').value);
        showMarkersByRatakm(searchValue);
        showCloseIcon();
    }
});

let tunnelitLayerGroup = L.layerGroup();
let sillatLayerGroup = L.layerGroup();
let tilirataosatLayerGroup = L.layerGroup();
let kilometrimerkitLayerGroup = L.layerGroup();
let tasoristeyksetLayerGroup = L.layerGroup();
kilometrimerkitLayerGroup.addTo(map);
let kayttokeskusalueetLayerGroup = L.layerGroup();

document.getElementById('tunnelitCheckbox').addEventListener('change', function() {
    if (this.checked) {
        tunnelitLayerGroup.addTo(map);
    } else {
        tunnelitLayerGroup.removeFrom(map);
    }
});

document.getElementById('sillatCheckbox').addEventListener('change', function() {
    if (this.checked) {
        sillatLayerGroup.addTo(map);
    } else {
        sillatLayerGroup.removeFrom(map);
    }
});

document.getElementById('tasoristeyksetCheckbox').addEventListener('change', function() {
    if (this.checked) {
        tasoristeyksetLayerGroup.addTo(map);
    } else {
        tasoristeyksetLayerGroup.removeFrom(map);
    }
});

document.getElementById('tilirataosatCheckbox').addEventListener('change', function() {
    if (this.checked) {
        tilirataosatLayerGroup.addTo(map);
    } else {
        tilirataosatLayerGroup.removeFrom(map);
    }
});

document.getElementById('kilometrimerkitCheckbox').addEventListener('change', function() {
    if (this.checked) {
        kilometrimerkitLayerGroup.addTo(map);
    } else {
        kilometrimerkitLayerGroup.removeFrom(map);
    }
});

document.getElementById('kayttokeskusalueetCheckbox').addEventListener('change', function() {
    if (this.checked) {
        kayttokeskusalueetLayerGroup.addTo(map);
    } else {
        kayttokeskusalueetLayerGroup.removeFrom(map);
    }
});

document.getElementById('menuButton').addEventListener('click', function() {
    var menuContent = document.getElementById('menuContent');
    if (menuContent.style.display === 'none') {
        menuContent.style.display = 'block';
    } else {
        menuContent.style.display = 'none';
    }
});

// Tunnelien lisääminen karttaan
fetch('tunnelit.geojson')
    .then(response => response.json())
    .then(data => {
        railGeometryData = data;
        
        const transformedData = {
            ...railGeometryData,
            features: railGeometryData.features.map(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    if (feature.geometry.type === 'MultiLineString') {
                        return {
                            ...feature,
                            geometry: {
                                ...feature.geometry,
                                coordinates: feature.geometry.coordinates.map(line => 
                                    line.map(coord => {
                                        const latlng = proj4('EPSG:3067', 'WGS84', coord);
                                        return [latlng[0], latlng[1]];
                                    })
                                )
                            }
                        };
                    } else {
                        return feature;
                    }
                } else {
                    return feature;
                }
            })
        };

        const geoLayer = L.geoJSON(transformedData, {
			style: function(feature) {
				return { color: "blue", weight: 5, zIndex: 1000 };
			},
			onEachFeature: function(feature, layer) {
				if (feature.properties && feature.properties.nimi) {
					layer.bindTooltip(feature.properties.nimi, {
						className: 'custom-tooltip',
						sticky: true  // Tämä saa tooltipin seuraamaan hiirtä
					});
				}
			}

		}).addTo(tunnelitLayerGroup);

        map.fitBounds(geoLayer.getBounds());
    })
    .catch(error => {
        console.error("Virhe ladattaessa tunneleiden geometriaa:", error);
    });

// Siltojen lisääminen karttaan
fetch('sillat.geojson')
    .then(response => response.json())
    .then(data => {
        railGeometryData = data;
        
        const transformedData = {
            ...railGeometryData,
            features: railGeometryData.features.map(feature => {
                if (feature.geometry && feature.geometry.coordinates) {
                    if (feature.geometry.type === 'MultiLineString') {
                        return {
                            ...feature,
                            geometry: {
                                ...feature.geometry,
                                coordinates: feature.geometry.coordinates.map(line => 
                                    line.map(coord => {
                                        const latlng = proj4('EPSG:3067', 'WGS84', coord);
                                        return [latlng[0], latlng[1]];
                                    })
                                )
                            }
                        };
                    } else {
                        return feature;
                    }
                } else {
                    return feature;
                }
            })
        };

        const geoLayer = L.geoJSON(transformedData, {
			style: function(feature) {
				return { color: "#56ff00", weight: 7, zIndex: 1000 };
			},
			onEachFeature: function(feature, layer) {
				if (feature.properties && feature.properties.nimi) {
					layer.bindTooltip(feature.properties.nimi, {
						className: 'custom-tooltip',
						sticky: true  // Tämä saa tooltipin seuraamaan hiirtä
					});
				}
			}

		}).addTo(sillatLayerGroup);

        map.fitBounds(geoLayer.getBounds());
    })
    .catch(error => {
        console.error("Virhe ladattaessa siltojen geometriaa:", error);
    });	

fetch('tasoristeykset.geojson')
  .then(response => {
    if (!response.ok) {
      throw new Error('Verkkovirhe' + response.status);
    }
    return response.json();
  })
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        // Popupin määrittely tulee tänne...
      },
      pointToLayer: function (feature, latlng) {

        const transformedCoords = proj4('EPSG:3067', 'EPSG:4326', [latlng.lng, latlng.lat]);
        return L.circleMarker([transformedCoords[1], transformedCoords[0]], {
           radius: 8,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).bindTooltip(`Tunnus: ${feature.properties.tunnus}<br>Nimi: ${feature.properties.nimi}`, {
		  permanent: false,
		  direction: 'top',
		  className: 'custom-tooltip'
		});
      }
    }).addTo(tasoristeyksetLayerGroup); // Lisää geojsonLayer suoraan tasoristeyksetLayerGroupiin
  })
  .catch(error => {
    console.error('Virhe ladattaessa tasoristeysten geometriaa:', error);
  });


fetch('tilirataosat.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
        data.features.forEach(feature => {
            if (feature.geometry && feature.geometry.type === "MultiPolygon") {
                let allPolygons = [];
                feature.geometry.coordinates.forEach(polygon => {
                    let polygonCoordinates = polygon[0].map(coord => {
                        let converted = proj4('EPSG:3067', 'WGS84', coord);
                        return [converted[1], converted[0]];
                    });
                    allPolygons.push(polygonCoordinates);
                });
                // Yhdistä tiedot ja luo yksi tooltip
                let tooltipContent = `Numero: ${feature.properties.numero}<br>Nimi: ${feature.properties.nimi}`;
                L.polygon(allPolygons)
                  .bindTooltip(tooltipContent, { className: 'rataosat', sticky: true, direction: 'top' })
                  .addTo(tilirataosatLayerGroup);
            }
        });
    })
    .catch(error => {
        console.error('Virhe ladattaessa tilirataosien geometriaa', error);
    });


fetch('ratakm.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
        data.features.forEach(function(feature) {
            if (feature.geometry && feature.properties) {
                const coords = feature.geometry.coordinates;
                const latlng = proj4('EPSG:3067', 'WGS84', coords);
                const marker = L.circleMarker([latlng[1], latlng[0]], {
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.5,
                    radius: 3
                }).bindTooltip(feature.properties.ratakm.toString(), {
                    direction: 'right',
                });

                marker.featureProperties = feature.properties;
                allMarkers.push(marker);
                marker.addTo(kilometrimerkitLayerGroup);
            }
        });

        onZoomEnd();  // Tarkista zoom-taso heti, kun markerit on lisätty.
    })
    .catch(error => {
        console.error('Virhe ladattaessa ratakilometrien geometriaa', error);
    });

map.on('zoomend', onZoomEnd);
map.on('moveend', onMoveEnd);

fetch('kayttokeskusalueet.geojson')
    .then(response => response.json())
    .then(data => {
        const transformedData = transformGeoJSONData(data);

        L.geoJSON(transformedData, {
            style: function(feature) {
                return {
                    color: '#ff7800',
                    weight: 1,
                    fillOpacity: 0.1
                };
            },
            onEachFeature: function(feature, layer) {
                // Tarkistetaan, onko ominaisuustietoja
                if (feature.properties) {
                    if (feature.properties.nimi) {
                        // Luodaan tooltip jokaiselle polygonille
                        layer.bindTooltip(feature.properties.nimi, {
                            className: 'kayttokeskusalueet',
							sticky: true,
                            direction: 'top'
                        });
                    }
                }
            }
        }).addTo(kayttokeskusalueetLayerGroup);
    })
    .catch(error => console.error('Virhe ladattaessa käyttökeskusalueiden geometriaa', error));

function transformGeoJSONData(geojsonData) {
    return {
        ...geojsonData,
        features: geojsonData.features.map(feature => {
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                return {
                    ...feature,
                    geometry: {
                        ...feature.geometry,
                        coordinates: transformCoordinates(feature.geometry.coordinates, feature.geometry.type)
                    }
                };
            }
            return feature;
        })
    };
}

function transformCoordinates(coordinates, type) {
    if (type === 'Polygon') {
        return coordinates.map(ring => ring.map(coord => proj4('EPSG:3067', 'EPSG:4326', coord)));
    } else if (type === 'MultiPolygon') {
        return coordinates.map(polygon => polygon.map(ring => ring.map(coord => proj4('EPSG:3067', 'EPSG:4326', coord))));
    }
    return coordinates;
}

function onZoomEnd() {
    const zoomLevel = map.getZoom();
    const currentBounds = map.getBounds();

    allMarkers.forEach(marker => {
        if (zoomLevel > 10 && currentBounds.contains(marker.getLatLng())) {
            marker.openTooltip();
        } else {
            marker.closeTooltip();
        }
    });
}

function onMoveEnd() {
    const currentBounds = map.getBounds();

    allMarkers.forEach(marker => {
        if (map.getZoom() > 10 && currentBounds.contains(marker.getLatLng())) {
            marker.openTooltip();
        } else {
            marker.closeTooltip();
        }
    });
}

let userMarker; // Globaali muuttuja käyttäjän merkkiä varten
let userHeading; // Globaali muuttuja käyttäjän suunnalle

function updateMarker(lat, lon, heading) {
    // Päivitä käyttäjän sijaintia osoittavaa merkkiä
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#3186cc",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
    }

    // Päivitä popup sisältämään ilmansuunta, jos se on saatavilla
    let popupContent = "Olet tässä: " + lat.toFixed(5) + ", " + lon.toFixed(5);
    if (heading !== undefined) {
        popupContent += "<br>Ilmansuunta: " + heading.toFixed(1) + "°";
        userHeading = heading;
    }
    userMarker.bindPopup(popupContent).openPopup();
}

function startTracking() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const heading = position.coords.heading; // Suunta, johon laite osoittaa, astetta (0 = pohjoinen)
            
            updateMarker(lat, lon, heading);
            
            // Zoomaa ja keskitä kartta uuteen sijaintiin
            map.setView([lat, lon], map.getZoom());
        }, function(error) {
            console.error("Sijainnin seuranta epäonnistui: ", error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
        });
    } else {
        alert("Selaimesi ei tue sijainnin hakua.");
    }
}

document.getElementById('locateUser').addEventListener('click', startTracking);


