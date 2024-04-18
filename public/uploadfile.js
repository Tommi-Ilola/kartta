document.addEventListener('DOMContentLoaded', function () {
    var gpxLayerGroup = L.layerGroup().addTo(map);
    var geojsonLayerGroup = L.layerGroup().addTo(map);
    var kmlLayerGroup = L.layerGroup().addTo(map);
    var csvLayerGroup = L.layerGroup().addTo(map);

    document.getElementById('file-input').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var data = event.target.result;
                var format = file.name.split('.').pop().toLowerCase();
                switch (format) {
case 'gpx':
    try {
        var gpxLayer = new L.GPX(data, {
            async: true,
            marker_options: {
                startIconUrl: window.location.origin + 'pin-icon-wpt.png', // Määrittele aloitusikonin polku
                endIconUrl: window.location.origin + 'pin-icon-wpt.png',     // Määrittele lopetusikonin polku
				  wptIcons: [],
				  wptIconsType: [],
                wptIconsUrls: {
                    '': window.location.origin + 'pin-icon-wpt.png'
                },
                wptIconTypeUrls: {
                    // esimerkki: erityyppiset ikonit eri waypoint-tyypeille
                    'Geocache Found': window.location.origin + 'pin-icon-wpt.png'
                },
                shadowUrl: null, // Jos et käytä varjoa, aseta tämä nulliksi
                iconSize: [23, 38], // Määrittele ikonin koko
                iconAnchor: [11, 37], // Määrittele ikonin ankkuri
				popupAnchor: [0, -38]
            },
            polyline_options: {
                color: 'blue',
                opacity: 0.75,
                weight: 3,
                lineCap: 'round'
            },
            onEachFeature: function(feature, layer) {
                // Tarkistetaan, onko ominaisuus waypoint ja sillä on nimi
                if (feature.properties && feature.properties.name) {
                    var popupContent = '<div class="custom-popup-content">';
                    popupContent += '<h3>' + feature.properties.name + '</h3>';
                    if (feature.properties.desc) {
                        popupContent += '<p>' + feature.properties.desc + '</p>';
                    }
                    popupContent += '</div>';

                    // Kytke popup featureen (waypoint)
                    layer.bindPopup(popupContent, { className: 'custom-popup' });
                }
            }
        }).on('loaded', function(e) {
            map.fitBounds(gpxLayer.getBounds());
        }).addTo(gpxLayerGroup);
    } catch (error) {
        console.error("Error parsing GPX data:", error);
    }
    break;
					case 'json':
					case 'geojson':
						L.geoJSON(JSON.parse(data), {
							pointToLayer: function (feature, latlng) {
								return L.marker(latlng, {
									icon: new L.Icon({
										iconUrl: window.location.origin + 'pin-icon-wpt.png',
										iconSize: [23, 38],
										iconAnchor: [11, 37]
									})
								});
							},
							onEachFeature: function (feature, layer) {
								if (feature.properties && feature.properties.name) {
									layer.bindTooltip(feature.properties.name, {permanent: true, className: 'custom-tooltip'});
								}
							}
						}).addTo(geojsonLayerGroup);
						break;
                    case 'kml':
                        omnivore.kml.parse(data).addTo(kmlLayerGroup);
                        break;
                    case 'csv':
                        omnivore.csv.parse(data).addTo(csvLayerGroup);
                        break;
                    default:
                        console.error('Unsupported file format');
                }
            };
            reader.onerror = function (event) {
                console.error("Failed to read file:", event.target.error);
            };
            reader.readAsText(file);
        }
    });
});

