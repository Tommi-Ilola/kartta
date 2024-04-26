document.addEventListener('DOMContentLoaded', function () {
	
    var fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var data = event.target.result;
                var format = file.name.split('.').pop().toLowerCase();
                var layer;

                switch (format) {
                    case 'gpx':
                        var gpx = new DOMParser().parseFromString(data, "application/xml");
                        var geojson = toGeoJSON.gpx(gpx);
                        layer = L.geoJSON(geojson, {
                            pointToLayer: function(feature, latlng) {
                                return L.marker(latlng, {
                                    icon: L.icon({
                                        iconUrl: window.location.origin + '/pin-icon-wpt.png', // Huomaa kauttaviiva URL:ssä
                                        iconSize: [23, 38],
                                        iconAnchor: [11, 37],
                                    })
                                });
                            },
                            onEachFeature: function(feature, layer) {
                                if (feature.properties && feature.properties.name) {
                                    layer.bindTooltip(feature.properties.name, {permanent: true, className: 'file-tooltip'});
                                }
                            }
                        }).addTo(map);
                        break;

                    case 'json':
                    case 'geojson':
                        layer = L.geoJSON(JSON.parse(data), {
                            pointToLayer: function (feature, latlng) {
                                return L.marker(latlng, {
                                    icon: new L.Icon({
                                        iconUrl: window.location.origin + '/pin-icon-wpt.png', // Huomaa kauttaviiva URL:ssä
                                        iconSize: [23, 38],
                                        iconAnchor: [11, 37]
                                    })
                                });
                            },
                            onEachFeature: function (feature, layer) {
                                if (feature.properties && feature.properties.name) {
                                    layer.bindTooltip(feature.properties.name, {permanent: true, className: 'file-tooltip'});
                                }
                            }
                        }).addTo(map);
                        break;

                    case 'kml':
                        layer = omnivore.kml.parse(data, null, L.geoJson(null, {
                            onEachFeature: function (feature, layer) {
                                if (feature.properties && feature.properties.name) {
                                    layer.bindTooltip(feature.properties.name, {permanent: true, className: 'file-tooltip'});
                                }
                                if (feature.geometry.type === "Point") {
                                    layer.setIcon(L.icon({
                                        iconUrl: window.location.origin + '/pin-icon-wpt.png',
                                        iconSize: [23, 38],
                                        iconAnchor: [11, 37]
                                    }));
                                }
                            }
                        })).addTo(map);
                        break;

                    case 'csv':
                        layer = omnivore.csv.parse(data, null, L.geoJson(null, {
                            onEachFeature: function (feature, layer) {
                                if (feature.properties && feature.properties.name) {
                                    layer.bindTooltip(feature.properties.name, {permanent: true, className: 'file-tooltip'});
                                }
                                layer.setIcon(L.icon({
                                    iconUrl: window.location.origin + '/pin-icon-wpt.png',
                                    iconSize: [23, 38],
                                    iconAnchor: [11, 37]
                                }));
                            }
                        })).addTo(map);
                        break;

                    default:
                        console.error('Unsupported file format');
                        return;
                }

                // Lisää karttataso kartalle oletuksena
                if (layer) {
                    layer.addTo(map);
                }

                // Luodaan käyttöliittymäelementit tiedoston hallintaan
		const filesDiv = document.getElementById('files');
		
		var fileLabel = document.createElement('label');
		fileLabel.className = 'filelabel'
	    	var checkbox = document.createElement('input');
                var removeButton = document.createElement('button');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
		    
		var removeButton = document.createElement('button');
		removeButton.textContent = '×';
		removeButton.className = 'painike';

                // Checkbox to control visibility of the layer
                checkbox.addEventListener('change', function () {
                    if (this.checked) {
                        layer.addTo(map);
                    } else {
                        map.removeLayer(layer);
                    }
                });

                // Button to remove the file and its layer
                removeButton.addEventListener('click', function () {
                map.removeLayer(layer);  // Poista karttataso
                fileLabel.remove();      // Poista label käyttöliittymästä
                });

		fileLabel.appendChild(checkbox);
	    	fileLabel.append(` ${fileName} `);
		fileLabel.appendChild(removeButton);
		document.getElementById('fileContent').appendChild(fileLabel);

		filesDiv.appendChild(fileLabel);
            };
            reader.readAsText(file);
        }
    });
});
