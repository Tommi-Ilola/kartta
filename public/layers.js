let tunnelitLayerGroup = L.layerGroup();
let sillatLayerGroup = L.layerGroup();
let tilirataosatLayerGroup = L.layerGroup();
let kilometrimerkitLayerGroup = L.layerGroup();
let tasoristeyksetLayerGroup = L.layerGroup();
kilometrimerkitLayerGroup.addTo(map);
let kayttokeskusalueetLayerGroup = L.layerGroup();
let ToimialueetLayerGroup = L.layerGroup();
let JunatLayerGroup = L.layerGroup();
let SyottoAsematLayerGroup = L.layerGroup();
let VKLayerGroup = L.layerGroup();

fetch('SA.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
        var saIcon = L.divIcon({
            className: 'custom-icon-container',
            html: "<img src='SA.png' style='width: 20px; height: 20px;'><div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 14px;'></div>",
            iconSize: [20, 20],
            iconAnchor: [9, 12],
            popupAnchor: [0, -12]
        });

        data.features.forEach(function(feature) {
            if (feature.geometry && feature.properties) {
                const coords = feature.geometry.coordinates;
                const properties = feature.properties;

                // Valitse tästä, mitkä tiedot haluat näyttää popupissa
                let popupContent = `<b>Nimi:</b> ${properties.name}<br>
									<b>Tunnus:</b> ${properties.SyöttöasemanTunnus}<br>
									<b>Tyyppi:</b> ${properties.Tyyppi}<br>
									<b>Ratanumero:</b> ${properties.Ratanumero}<br>
									<b>Ratakilometrisijainti:</b> ${properties.Ratakilometrisijainti}<br>
									<b>Tilirataosa:</b> ${properties.Tilirataosa}<br>
									<b>Kunnossapitoalue:</b> ${properties.Kunnossapitoalue}<br>
									<b>Isännöintialue:</b> ${properties.Isännöintialue}<br>
									`;
                
                // Lisää Google Maps -linkki
                const googleMapsLink = `https://www.google.com/maps/?q=${coords[1]},${coords[0]}`;
                popupContent += `<a href="${googleMapsLink}" target="_blank">Näytä Google Mapsissa</a>`;

                const marker = L.marker([coords[1], coords[0]], {icon: saIcon})
                .bindTooltip(properties.name ? properties.name.toString() : "Nimetön", {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip'
                })
                .bindPopup(popupContent)
                .addTo(SyottoAsematLayerGroup);

                allMarkers.push(marker);
            }
        });
    })
    .catch(error => {
        console.error('Virhe ladattaessa syöttöasemien geometriaa', error);
    });

fetch('VK.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data => {
	var vkIcon = L.divIcon({
        className: 'custom-icon-container',
        html: "<img src='VK.png' style='width: 20px; height: 20px;'><div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 14px;'></div>",
	iconSize: [20, 20], // Kuvakkeen koko pikseleinä
	iconAnchor: [9, 12], // Kuvakkeen ankkuripiste (kuvakkeen keskipiste alareunassa)
	popupAnchor: [0, -12] // Pop-upin ankkurointipiste suhteessa kuvakkeeseen
	});
	
        data.features.forEach(function(feature) {
            if (feature.geometry && feature.properties) {
                const coords = feature.geometry.coordinates;
                const properties = feature.properties;

                // Valitse tästä, mitkä tiedot haluat näyttää popupissa
                let popupContent = `<b>Nimi:</b> ${properties.Name}<br>
									<b>Tyyppi:</b> ${properties.Tyyppi}<br>
									<b>Ratanumero:</b> ${properties.Ratanumero}<br>
									<b>Ratakilometrisijainti:</b> ${properties.Ratakilometrisijainti}<br>
									<b>Tilirataosa:</b> ${properties.Tilirataosa}<br>
									<b>Kunnossapitoalue:</b> ${properties.Kunnossapitoalue}<br>
									<b>Isännöintialue:</b> ${properties.Isännöintialue}<br>
									`;
                
                // Lisää Google Maps -linkki
                const googleMapsLink = `https://www.google.com/maps/?q=${coords[1]},${coords[0]}`;
                popupContent += `<a href="${googleMapsLink}" target="_blank">Näytä Google Mapsissa</a>`;

                const marker = L.marker([coords[1], coords[0]], {icon: vkIcon})
                .bindTooltip(properties.Name ? properties.Name.toString() : "Nimetön", {
                    permanent: false,
                    direction: 'top',
                    className: 'custom-tooltip'
                })
                .bindPopup(popupContent)
	        marker.addTo(VKLayerGroup);
                allMarkers.push(marker);
	    }
	});
    })
    .catch(error => {
        console.error('Virhe ladattaessa välikytkinasemien geometriaa', error);
    });

	
document.getElementById('SyottoAsematCheckbox').addEventListener('change', function() {
    if (this.checked) {
        SyottoAsematLayerGroup.addTo(map);
    } else {
        SyottoAsematLayerGroup.removeFrom(map);
    }
});

document.getElementById('VKCheckbox').addEventListener('change', function() {
    if (this.checked) {
        VKLayerGroup.addTo(map);
    } else {
        VKLayerGroup.removeFrom(map);
    }
});


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

document.getElementById('ToimialueetCheckbox').addEventListener('change', function() {
    if (this.checked) {
        ToimialueetLayerGroup.addTo(map);
    } else {
        ToimialueetLayerGroup.removeFrom(map);
    }
});

document.getElementById('JunatCheckbox').addEventListener('change', function() {
    if (this.checked) {
        JunatLayerGroup.addTo(map);
    } else {
        JunatLayerGroup.removeFrom(map);
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
				return { color: "#4caf50", weight: 7, zIndex: 1000 };
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
				  .setStyle({ className: 'rataosat'})
				  .addTo(tilirataosatLayerGroup);
            }
        });
    })
    .catch(error => {
        console.error('Virhe ladattaessa tilirataosien geometriaa', error);
    });

const gmStyle = {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 3
};

const satelliteStyle = {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 3
};

function updateMarkerStyles() {
    const style = currentBaseLayer === "gm" ? gmStyle : satelliteStyle;
    allMarkers.forEach(marker => {
        marker.setStyle(style);
    });
}

function updateTooltipStyles() {
    const tooltipClass = currentBaseLayer === "gm" ? 'tooltip-gm' : 'tooltip-satellite';
    allMarkers.forEach(marker => {
        const tooltip = marker.getTooltip();
        if (tooltip) {
            tooltip.options.className = tooltipClass;
            marker.unbindTooltip().bindTooltip(tooltip.getContent(), tooltip.options);
        }
    });
}

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
                const style = currentBaseLayer === "gm" ? gmStyle : satelliteStyle;
                const marker = L.circleMarker([latlng[1], latlng[0]], style)
                    .bindTooltip(feature.properties.ratakm.toString(), {
                        direction: 'right',
                        className: currentBaseLayer === "gm" ? 'tooltip-gm' : 'tooltip-satellite'
                    });
                marker.featureProperties = feature.properties;
                allMarkers.push(marker);
                marker.addTo(map);
            }
        });
    })
    .catch(error => {
        console.error('Virhe ladattaessa ratakilometrien geometriaa', error);
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

fetch('kayttokeskusalueet.geojson')
    .then(response => response.json())
    .then(data => {
        const transformedData = transformGeoJSONData(data);

        L.geoJSON(transformedData, {
            style: function(feature) {
                let color;
                switch (feature.properties.nimi) {
                    case 'Helsinki':
                        color = '#ff6a00'; // Punainen
                        break;
                    case 'Tampere':
                        color = '#0080ff'; // Sininen
                        break;
                    case 'Kouvola':
                        color = '#98ff98'; // Vihreä
                        break;
                    case 'Oulu':
                        color = '#ffff98'; // Keltainen
                        break;
                    default:
                        color = '#FF00FF'; // Jokin muu väri
                }
                return {
                    color: color, // Käytä 'color' muuttujaa
                    weight: 2,
                    fillOpacity: 0.2
                };
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties && feature.properties.nimi) {
                    layer.bindTooltip(feature.properties.nimi, {
                        className: 'kayttokeskusalueet',
                        sticky: true,
                        direction: 'top'
                    });
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

// Muutettu GeoJSON-data lisätään kartalle
fetch('toimialueet.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        const transformedData = transformGeoJSONData(geojsonData);
        L.geoJSON(transformedData, {
            style: function(feature) {
                // Oletetaan, että jokaisella featurella on 'properties' joka sisältää 'vari'-avaimen
                return {
                    color: feature.properties.vari,
                    weight: 6,
                    strokeOpacity: 0.5
                };
            },
            onEachFeature: function(feature, layer) {
                if (feature.properties && feature.properties.nimi) {
                    layer.bindTooltip(feature.properties.nimi, {
                        className: 'rataosat',
                        sticky: true,
                        direction: 'top'
                    });
                }
            }
        }).addTo(ToimialueetLayerGroup);
    })
    .catch(error => console.error('Error loading GeoJSON data:', error));


function transformGeoJSONData(geojsonData) {
    return {
        ...geojsonData,
        features: geojsonData.features.map(feature => {
            switch (feature.geometry.type) {
                case 'Polygon':
                case 'MultiPolygon':
                    // Muutettu logiikka
                    return {
                        ...feature,
                        geometry: {
                            ...feature.geometry,
                            coordinates: transformCoordinates(feature.geometry.coordinates, feature.geometry.type)
                        }
                    };
                case 'GeometryCollection':
                    // Käsittele jokainen geometria GeometryCollectionissa
                    return {
                        ...feature,
                        geometry: {
                            ...feature.geometry,
                            geometries: feature.geometry.geometries.map(geometry => {
                                switch (geometry.type) {
                                    case 'MultiLineString':
                                    case 'LineString': // Jos LineString-geometrioita on, käsittele ne samalla tavalla
                                        return {
                                            ...geometry,
                                            coordinates: geometry.coordinates.map(line => 
                                                line.map(coord => {
                                                    const [x, y] = proj4('EPSG:3067', 'EPSG:4326', coord);
                                                    return [x, y]; // Oikea järjestys: [latitude, longitude]
                                                })
                                            )
                                        };
                                    // Lisää tapauksia tarvittaessa
                                    default:
                                        return geometry;
                                }
                            })
                        }
                    };
                default:
                    return feature;
            }
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

function haeJunienSijainnit() {
    const url = 'https://rata.digitraffic.fi/api/v1/train-locations/latest/';
    fetch(url)
        .then(response => response.json())
        .then(data => {
            paivitaJunienSijainnitKartalla(data);
        })
        .catch(error => console.error('Virhe ladattaessa junien sijainteja:', error));
}

let junienMarkerit = {};

function paivitaJunienSijainnitKartalla(data) {
	data.forEach(juna => {
		if (juna.location && Array.isArray(juna.location.coordinates) && juna.location.coordinates.length === 2) {
			const [lon, lat] = juna.location.coordinates;
			const trainNumber = juna.trainNumber;
			const speed = juna.speed;

			// Muodosta HTML sisältö pop-uppiin
			const popupContent = `
				<div>
					<h4>Juna ${trainNumber}</h4>
					<p>Nopeus: ${speed} km/h</p>
				</div>
			`;

			const customIcon = L.icon({
				iconUrl: 'train.png', // Kuvakkeen polku
				iconSize: [20, 20], // Kuvakkeen koko pikseleinä
				iconAnchor: [9, 12], // Kuvakkeen ankkuripiste (kuvakkeen keskipiste alareunassa)
				popupAnchor: [0, -12] // Pop-upin ankkurointipiste suhteessa kuvakkeeseen
			});

			if (junienMarkerit[trainNumber]) {
				// Päivitä olemassa olevan markerin sijainti
				junienMarkerit[trainNumber].setLatLng([lat, lon]);
			} else {
				// Luo uusi marker kartalle ja aseta pop-up sisältö
				junienMarkerit[trainNumber] = L.marker([lat, lon], {icon: customIcon})
					.addTo(JunatLayerGroup)
					.bindPopup(popupContent);
			}
		} else {
			console.error('Puuttuvat tai virheelliset sijaintitiedot junalle', juna);
		}
	});
}

setInterval(haeJunienSijainnit, 1000);

