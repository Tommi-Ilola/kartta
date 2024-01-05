// Määritellään projektiotiedot
proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");
const map = L.map('map').setView([62.070149, 26.232580], 7);

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

document.getElementById('menuButton').addEventListener('click', function() {
    var menuContent = document.getElementById('menuContent');
    if (menuContent.style.display === 'none') {
        menuContent.style.display = 'block';
    } else {
        menuContent.style.display = 'none';
    }
});

// Tunnelien lisääminen karttaan
fetch('https://rata.digitraffic.fi/infra-api/0.7/12814/tunnelit.geojson?time=2023-11-22T08:30:00Z/2023-11-22T08:30:00Z')
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
fetch('https://rata.digitraffic.fi/infra-api/0.7/12814/sillat.geojson?time=2023-11-22T08:30:00Z/2023-11-22T08:30:00Z')
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

fetch('https://rata.digitraffic.fi/infra-api/0.7/12714/tasoristeykset.geojson?time=2023-11-02T22:00:00Z/2023-11-02T22:00:00Z')
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
    console.error('Latausvirhe:', error);
  });


fetch('https://rata.digitraffic.fi/infra-api/0.7/12713/tilirataosat.geojson?time=2023-11-02T22:00:00Z/2023-11-02T22:00:00Z')
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
        console.error('There was a problem:', error);
    });


fetch('https://rata.digitraffic.fi/infra-api/0.7/12678/kilometrimerkit.geojson?time=2023-10-27T09:58:00Z/2023-10-27T09:58:00Z')
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
        console.error('There was a problem:', error);
    });

map.on('zoomend', onZoomEnd);
map.on('moveend', onMoveEnd);

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

// Tämä funktio tekee HTTP-pyynnön ratakm-arvon perusteella ja lisää markerin kartalle
function searchByKmAndAddMarker() {
    // Oletetaan, että hakukentässä on id 'searchInput'
    const ratakmValue = document.getElementById('searchInput').value;
    // Oletetaan, että käytät kiinteää ratanumeroa, esimerkiksi '1'
    const ratanumero = '1';
  
    // Käytä hakukentän arvoa ratakm-arvona ja kiinteää ratanumeroa
    const url = `https://rata.digitraffic.fi/infra-api/0.7/ratakmsijainti/${ratanumero}/${ratakmValue}`;
  
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Oletetaan, että saat vastauksena koordinaatteja sisältävän objektin
        // Sinun täytyy mukauttaa seuraavaa koodia vastaamaan oikeaa vastausrakennetta
        const coordinates = data.features[0].geometry.coordinates;
        const transformedCoordinates = proj4('EPSG:3067', 'EPSG:4326', coordinates);
        addMarkerToMap(transformedCoordinates[1], transformedCoordinates[0], `Ratakm: ${ratakmValue}`);
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }
  
  // Tämä funktio lisää markerin kartalle annetuissa koordinaateissa ja avaa popupin annetulla tekstillä
  function addMarkerToMap(latitude, longitude, popupText) {
    const marker = L.marker([latitude, longitude]).bindPopup(popupText);
    marker.addTo(map);
    map.setView([latitude, longitude], 14); // Zoomaa karttaa ja keskittää sen uuteen markeriin
  }
  
  // Lisää tapahtumankäsittelijä hakunapille
  document.getElementById('searchButton').addEventListener('click', searchByKmAndAddMarker);
  
  // Lisää tapahtumankäsittelijä Enter-näppäimelle hakukentässä
  document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      searchByKmAndAddMarker();
    }
  });


