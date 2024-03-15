map.on('click', function(e) {
	const resultsDiv = document.getElementById('results');
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
                const properties = data.features[0].properties;

                // Oikea tunnisteiden määritelmä
                const rautatieliikennepaikanTunniste = properties.rautatieliikennepaikka;
                const liikennepaikkavalinTunniste = properties.liikennepaikkavali;

                Promise.all([
                    haeLiikennepaikanNimi(rautatieliikennepaikanTunniste),
                    haeLiikennepaikkavalinTiedot(liikennepaikkavalinTunniste)
                ]).then(([rautatieliikennepaikanNimi, liikennepaikkavalinTiedot]) => {
                    // Käsitellään mahdollinen "Ei saatavilla" arvo
                    const liikennepaikkaHtml = rautatieliikennepaikanNimi !== 'Nimi ei saatavilla' ? `<strong>Liikennepaikka:</strong> ${rautatieliikennepaikanNimi}<br>` : '';
                    const liikennepaikkavaliHtml = liikennepaikkavalinTiedot.alkuLiikennepaikanNimi !== 'Nimi ei saatavilla' && liikennepaikkavalinTiedot.loppuLiikennepaikanNimi !== 'Nimi ei saatavilla'
                        ? `<strong>Liikennepaikkaväli:</strong> ${liikennepaikkavalinTiedot.alkuLiikennepaikanNimi} - ${liikennepaikkavalinTiedot.loppuLiikennepaikanNimi}<br>`
                        : '';

                    // Luodaan popupin sisältö
                    const popupContent = `
                        <strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
                        <strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `km ${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
                        <strong>Etäisyys radasta:</strong> ${properties.etaisyysRadastaMetria} metriä<br>
                        ${liikennepaikkaHtml}
                        ${liikennepaikkavaliHtml}
                        <a href="${googleMapsUrl}" target="_blank">Avaa Google Mapsissa</a>
                    `;

                    // Luodaan marker ja lisätään se kartalle
                    const marker = L.marker([lat, lng], { icon: customIcon })
                        .addTo(map)
                        .bindPopup(popupContent);
                    marker.openPopup();

                    // Lisätään marker hakutuloksiin ja mahdollistetaan niiden poisto
                    searchMarkers.push(marker);
                    lisaaResultItem(properties, lat, lng, googleMapsUrl, marker);
                    RemoveMarkersButton();
                }).catch(error => {
                    console.error('Error while fetching station or track section names:', error);
                });
            }
        })
        .catch(error => {
            console.error('Error while fetching data from API:', error);
        });
});

function haeLiikennepaikanNimi(tunniste) {
    if (!tunniste) {
        console.log('Tunniste puuttuu, palautetaan "Ei saatavilla".');
        return Promise.resolve('Ei saatavilla'); // Tarkistetaan, että tunniste on annettu
    }

    const url = `https://rata.digitraffic.fi/infra-api/0.7/${tunniste}.geojson`;
    console.log(`Tekee API-kutsun liikennepaikan nimelle: ${url}`);
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Vastaus liikennepaikan nimelle:', data);
            if (data && data.features && data.features.length > 0 && data.features[0].properties) {
                return data.features[0].properties.nimi || 'Nimi ei saatavilla';
            }
            return 'Nimi ei saatavilla';
        })
        .catch(error => {
            console.error('Virhe ladattaessa liikennepaikan nimeä:', error);
            return 'Nimi ei saatavilla';
        });
}

function haeLiikennepaikkavalinTiedot(liikennepaikkavaliTunniste) {
    // Otetaan liikennepaikkavälin tunniste ja haetaan siitä alku- ja loppuliikennepaikan nimet
    console.log(`Tekee API-kutsun liikennepaikkavälin tiedoille: ${liikennepaikkavaliTunniste}`);
    return fetch(`https://rata.digitraffic.fi/infra-api/0.7/${liikennepaikkavaliTunniste}.geojson`)
        .then(response => response.json())
        .then(data => {
            console.log('Vastaus liikennepaikkavälin tiedoille:', data);
            // Etsitään alku- ja loppuliikennepaikan tunnisteet
            const alkuTunniste = data.features[0].properties.alkuliikennepaikka;
            const loppuTunniste = data.features[0].properties.loppuliikennepaikka;
            // Haetaan molempien liikennepaikkojen nimet rinnakkain
            return Promise.all([
                haeLiikennepaikanNimi(alkuTunniste),
                haeLiikennepaikanNimi(loppuTunniste)
            ]);
        })
        .then(([alkuLiikennepaikanNimi, loppuLiikennepaikanNimi]) => {
            return {
                alkuLiikennepaikanNimi,
                loppuLiikennepaikanNimi
            };
        })
        .catch(error => {
            console.error('Virhe ladattaessa liikennepaikkavälin tietoja:', error);
            return {
                alkuLiikennepaikanNimi: 'Nimi ei saatavilla',
                loppuLiikennepaikanNimi: 'Nimi ei saatavilla'
            };
        });
}

function lisaaResultItem(properties, lat, lng, googleMapsUrl, marker) {
    const resultsDiv = document.getElementById('results');
    const item = document.createElement('table');
    item.className = 'resultItem';
    item.innerHTML = `
	<table class="resultItem">
	 <tr>
	  <th><strong>+</strong></th>
	   <td>        
		<strong>Kaupunki:</strong> Ei tiedossa<br>
        <strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
        <strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `km ${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
        <strong>Etäisyys radasta:</strong> ${properties.etaisyysRadastaMetria} metriä<br>
        <a href="${googleMapsUrl}" target="_blank" style="color: #0078a8;">Avaa Google Mapsissa</a>
	   </td>
	 </tr>
	</table> 
    `;

    // Kun resultItemia klikataan, keskitä kartta markeriin
    item.addEventListener('click', function() {
        map.setView(marker.getLatLng(), 15);
        marker.openPopup();
    });

    resultsDiv.appendChild(item);
    resultsDiv.style.display = 'block';
}
