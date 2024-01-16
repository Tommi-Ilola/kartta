let tunnelitLayerGroup = L.layerGroup();
let sillatLayerGroup = L.layerGroup();
let tilirataosatLayerGroup = L.layerGroup();
let kilometrimerkitLayerGroup = L.layerGroup();
let tasoristeyksetLayerGroup = L.layerGroup();
kilometrimerkitLayerGroup.addTo(map);
let LPLayerGroup = L.layerGroup();
let RadatLayerGroup = L.layerGroup();

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

document.getElementById('LPCheckbox').addEventListener('change', function() {
    if (this.checked) {
        LPLayerGroup.addTo(map);
    } else {
        LPLayerGroup.removeFrom(map);
    }
});

document.getElementById('RadatCheckbox').addEventListener('change', function() {
    if (this.checked) {
        RadatLayerGroup.addTo(map);
    } else {
        RadatLayerGroup.removeFrom(map);
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
fetch('https://rata.digitraffic.fi/infra-api/0.7/13018/kunnossapitoalueet.geojson?time=2024-01-12T09:10:00Z/2024-01-12T09:10:00Z')
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


fetch('https://rata.digitraffic.fi/infra-api/0.7/13011/kilometrimerkit.geojson?time=2024-01-07T22:00:00Z/2024-01-07T22:00:00Z')
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

// Lataa ratojen geometria tiedostosta
fetch('https://rata.digitraffic.fi/infra-api/0.7/12680/radat.geojson?time=2023-10-27T09:58:00Z/2023-10-27T09:58:00Z')
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
                return { color: "blue", weight: 3, zIndex: 1000 };
            }
        }).addTo(RadatLayerGroup);
    })
    .catch(error => {
        console.error("Virhe ladattaessa ratojen geometriaa:", error);
    });



fetch('https://rata.digitraffic.fi/infra-api/0.7/13008/kayttokeskukset.geojson?time=2024-01-07T22:00:00Z/2024-01-07T22:00:00Z')
    .then(response => response.json())
    .then(data => {
        const transformedData = transformGeoJSONData(data);

        L.geoJSON(transformedData, {
            style: function(feature) {
				let color;
                switch (feature.properties.name) {
                    case 'Helsinki':
                        color = '#FF0000'; // Punainen
                        break;
                    case 'Tampere':
                        color = '#0000FF'; // Sininen
                        break;
                    case 'Kouvola':
                        color = '#00FF00'; // Vihreä
                        break;
                    case 'Oulu':
                        color = '#FFFF00'; // Keltainen
                        break;
                    default:
                        color = '#FF00FF'; // Jokin muu väri
                }
                return {
                    color: 'color',
                    weight: 1.5,
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
        }).addTo(LPLayerGroup);
    })
    .catch(error => console.error('Error loading GeoJSON data:', error));

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