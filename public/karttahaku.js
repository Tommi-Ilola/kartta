map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
	const googleMapsUrl = `https://www.google.com/maps/?q=${lat},${lng}`;

	const customIcon = L.divIcon({
		className: 'custom-div-icon',
		html: `<div style='background-image: url(MyClickMarker.png);' class='marker-pin' style='background-color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border: 2px solid black;'><span class='marker-number' style='font-size: 25px;top: -3px;'>+</span></div>`,
		iconSize: [30, 42],
		iconAnchor: [14, 49],
		popupAnchor: [0, -48]
	});

    const apiUrl = `https://rata.digitraffic.fi/infra-api/0.7/koordinaatit/${lat},${lng}.geojson?srsName=epsg:4326`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const properties = feature.properties;

                const popupContent = `
                    <strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
                    <strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `km ${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
                    <strong>Etäisyys radasta:</strong> ${properties.etaisyysRadastaMetria} metriä<br>
					<a href="${googleMapsUrl}" target="_blank">Avaa Google Mapsissa</a>
                `;

                const marker = L.marker([lat, lng], { icon: customIcon })
					.addTo(map)
					.bindPopup(popupContent);
				marker.openPopup();

				searchMarkers.push(marker);
				RemoveMarkersButton();
            }
        })
        .catch(error => {
            console.error('Virhe ladattaessa dataa API:sta:', error);
        });
});
