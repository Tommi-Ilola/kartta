let allMarkers = [];
let searchMarkers = [];
let currentCity = ""; // Määritetään ulkoinen muuttuja kaupungin nimelle
let removeButton = createRemoveMarkersButton();

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
    const stringValue = value.toString();

    const parts = stringValue.split("+");
    if (parts.length == 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 1000;
    } else {
        return parseFloat(stringValue);
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

    let found = false;
    const parsedSearchValue = parseRatakmValue(ratakmValue);

    allMarkers.forEach(marker => {
        const featureProps = marker.featureProperties;
        const markerRatakm = parseRatakmValue(featureProps.ratakm.toString());

        if (Math.abs(markerRatakm - parsedSearchValue) < 0.001) {
            found = true;
            const lat = marker.getLatLng().lat;
            const lon = marker.getLatLng().lng;

            // Hae kaupunki ja päivitä tulokset riippumatta haun tuloksesta
            getCityFromCoordinates(lat, lon, (city) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'resultItem';
                resultItem.innerHTML = `
                    <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
                    <strong>Ratakm:</strong> ${featureProps.ratakm}<br>
                    <strong>Ratanumero:</strong> ${featureProps.ratanumero || 'Ei määritelty'}
                `;

                // Lisää data-attribuutti markerin indeksillä
                resultItem.setAttribute('data-marker-index', allMarkers.indexOf(marker));

                // Lisää kuuntelija, joka korostaa markerin kun tulosta klikataan
                resultItem.addEventListener('click', function() {
                    highlightMarker(marker);
                });

                resultsDiv.appendChild(resultItem);
            });
        }
	});
	// Näytä viesti, jos tuloksia ei löydy
	if (!found) {
		resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
	}

	// Näytä results-div
	resultsDiv.style.display = 'block';

	// Varmista, että poistopainike on olemassa ja näkyvissä
	let removeButton = document.getElementById('removeMarkersButton');
	if (!removeButton) {
		removeButton = document.createElement('button');
		removeButton.id = 'removeMarkersButton';
		removeButton.textContent = 'Poista merkit kartalta';
		removeButton.addEventListener('click', clearSearchMarkers);
		resultsDiv.appendChild(removeButton);
	}
	removeButton.style.display = 'block';
}

// Oletetaan, että olet jo tuonut ja tallentanut kaikki ratakilometrit allMarkers-muuttujaan
// ja että jokaisella markerilla on featureProperties, joka sisältää kyseisen ratakilometrin tiedot

function findMarkersByRatanumero(ratanumero) {
  // Filtteröi kaikki markerit, jotka vastaavat annettua ratanumeroa
  return allMarkers.filter(marker => marker.featureProperties.ratanumero === ratanumero);
}

function findAndShowIntermediatePoint(searchValue) {
    document.getElementById('results').innerHTML = '';
    const resultsDiv = document.getElementById('results');
    const parsedSearchValue = parseRatakmValue(searchValue);
    const baseKm = Math.floor(parsedSearchValue);
    const fraction = parsedSearchValue - baseKm;
    const ratanumerot = allMarkers.map(marker => marker.featureProperties.ratanumero);
    const uniqueRatanumerot = [...new Set(ratanumerot)];
    let found = false;

    uniqueRatanumerot.forEach(ratanumero => {
        const markers = findMarkersByRatanumero(ratanumero);
        markers.sort((a, b) => parseRatakmValue(a.featureProperties.ratakm) - parseRatakmValue(b.featureProperties.ratakm));
    
    for (let i = 0; i < markers.length - 1; i++) {
        const currentKm = parseRatakmValue(markers[i].featureProperties.ratakm);
        const nextKm = parseRatakmValue(markers[i + 1].featureProperties.ratakm);
        if (currentKm <= baseKm && nextKm >= baseKm + 1) {
            const interpolatedLatLng = interpolateLatLng(
                markers[i].getLatLng(),
                markers[i + 1].getLatLng(),
                fraction
            );

            // Luo markeri interpoloidulle sijainnille ja lisää se kartalle
            const popupMarker = L.marker(interpolatedLatLng).addTo(map);
            popupMarker.bindPopup(`Ratakm: ${searchValue} Ratanumero: ${ratanumero}`);
            searchMarkers.push(popupMarker); // Lisää marker hakutulosten markerien joukkoon

            // Luo ja lisää tulostietue
            updateResultsDivWithIntermediatePoints(searchValue, interpolatedLatLng, ratanumero);
            found = true;
            break;
        }
    }
});

if (!found) {
    resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
}

// Näytä results-div
resultsDiv.style.display = 'block';

// Luo tai päivitä poistopainiketta
let removeButton = document.getElementById('removeMarkersButton');
if (!removeButton) {
    removeButton = document.createElement('button');
    removeButton.id = 'removeMarkersButton';
    removeButton.textContent = 'Poista merkit kartalta';
    removeButton.addEventListener('click', clearSearchMarkers);
    resultsDiv.appendChild(removeButton);
}
    if (searchMarkers.length > 0) {
        document.getElementById('removeMarkersButton').style.display = 'block'; // Näytä painike
    }
    updateRemoveButtonVisibility();
}

function updateResultsDivWithIntermediatePoints(searchValue, latLng, ratanumero) {
    const resultsDiv = document.getElementById('results');
    
    getCityFromCoordinates(latLng.lat, latLng.lng, (city) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'resultItem';
        resultItem.innerHTML = `
            <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
            <strong>Ratakm:</strong> ${searchValue}<br>
            <strong>Ratanumero:</strong> ${ratanumero}
        `;

        // Luo marker tai hae olemassa oleva
        const popupMarker = L.marker([latLng.lat, latLng.lng]).addTo(map);
        popupMarker.bindPopup(`
            <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
            <strong>Ratakm:</strong> ${searchValue}<br>
            <strong>Ratanumero:</strong> ${ratanumero}
        `);

        // Lisää marker hakutulosten markerien joukkoon
        searchMarkers.push(popupMarker);

        // Lisää data-attribuutit
        resultItem.setAttribute('data-lat', latLng.lat);
        resultItem.setAttribute('data-lng', latLng.lng);

        // Kuuntelija klikkaustapahtumalle
        resultItem.addEventListener('click', function() {
            map.setView([latLng.lat, latLng.lng], 11); // Voit säätää zoomaustasoa tarpeen mukaan
            popupMarker.openPopup();
        });

        resultsDiv.appendChild(resultItem);

        // Luo poistopainike, jos sitä ei ole vielä olemassa
        let removeButton = document.getElementById('removeMarkersButton');
        if (!removeButton) {
            removeButton = document.createElement('button');
            removeButton.id = 'removeMarkersButton';
            removeButton.textContent = 'Poista merkit kartalta';
            removeButton.addEventListener('click', clearSearchMarkers);
            resultsDiv.appendChild(removeButton);
        }

        // Näytä poistopainike
        removeButton.style.display = 'block';
    });
}


function interpolateLatLng(latlng1, latlng2, fraction) {
    const lat = latlng1.lat + (latlng2.lat - latlng1.lat) * fraction;
    const lng = latlng1.lng + (latlng2.lng - latlng1.lng) * fraction;
    return L.latLng(lat, lng);
}

// Luo "Poista markerit" -painike kartan yhteyteen tai muuhun sopivaan paikkaan
function createRemoveMarkersButton() {
    let removeButton = document.getElementById('removeMarkersButton');
    if (!removeButton) {
        removeButton = document.createElement('button');
        removeButton.id = 'removeMarkersButton';
        removeButton.textContent = 'Poista merkit kartalta';
        removeButton.style.display = 'none'; // Piilota aluksi
        removeButton.addEventListener('click', clearSearchMarkers);

        // Lisää painike karttaelementin yhteyteen tai muuhun sopivaan paikkaan
        document.body.appendChild(removeButton); // Vaihda tämä sopivaan paikkaan
    }
    return removeButton;
}

// Kutsu tätä funktiota, kun sovellus käynnistyy


function updateRemoveButtonVisibility() {
    if (searchMarkers.length > 0) {
        removeButton.style.display = 'block';
    } else {
        removeButton.style.display = 'none';
    }
}

function clearSearchMarkers() {
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];
    updateRemoveButtonVisibility(); // Päivitä painikkeen näkyvyys
}

function showCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>'; // Sulje-ikoni

}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier-icon">&#x1F50E;&#xFE0E;</span>'; // Suurennuslasi-ikoni
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    resetMarkerStyles();
    document.getElementById('results').style.display = 'none';
    showMagnifierIcon();
}

// Kun käyttäjä suorittaa haun
document.getElementById('searchButton').addEventListener('click', function() {
	if (document.getElementById('results').style.display === 'block') {
		resetSearch();
	} else {
	const searchValue = document.getElementById('searchInput').value;
		findAndShowIntermediatePoint(searchValue);
		showCloseIcon();
	}
});

// Olemassa olevaan kuuntelijaan enterille
document.getElementById('searchInput').addEventListener('keyup', function(event) {
	if (event.key === 'Enter' || event.keyCode === 13) {
	const searchValue = document.getElementById('searchInput').value;
	findAndShowIntermediatePoint(searchValue);
	showCloseIcon();
	}
});

createRemoveMarkersButton();

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





