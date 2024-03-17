let liikennepaikatData;
let liikennepaikkavalitData;

// Ladataan GeoJSON-tiedoston sisältö
async function lataaGeojsonData(url) {
    try {
        const vastaus = await fetch(url);
        const data = await vastaus.json();
        return data;
    } catch (error) {
        console.error('Virhe ladattaessa GeoJSON-tiedostoa:', error);
        return null;
    }
}

// Käytä tätä funktiota ladataksesi liikennepaikat ja liikennepaikkavälit käynnistyksen yhteydessä
async function alustaGeojsonData() {
    liikennepaikatData = await lataaGeojsonData('liikennepaikat.geojson');
    liikennepaikkavalitData = await lataaGeojsonData('liikennepaikkavalit.geojson');
}

// Kutsu tätä funktiota, kun sovelluksesi latautuu
alustaGeojsonData();

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

                const rautatieliikennepaikanTunniste = properties.rautatieliikennepaikka;
                const liikennepaikkavalinTunniste = properties.liikennepaikkavali;

			Promise.all([
				rautatieliikennepaikanTunniste ? haeLiikennepaikanNimiGeojsonista(rautatieliikennepaikanTunniste) : Promise.resolve(null),
				liikennepaikkavalinTunniste ? haeLiikennepaikkavalinNimiGeojsonista(liikennepaikkavalinTunniste) : Promise.resolve(null)
			]).then(([rautatieliikennepaikanNimi, liikennepaikkavalinNimi]) => {
				let liikennepaikkaHtml = rautatieliikennepaikanNimi ? `<strong>Liikennepaikka:</strong> ${rautatieliikennepaikanNimi}<br>` : '';
				let liikennepaikkavaliHtml = liikennepaikkavalinNimi ? `<strong>Liikennepaikkaväli:</strong> ${liikennepaikkavalinNimi}<br>` : '';


                    const popupContent = `
                        <strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
                        <strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
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
                    lisaaResultItem(properties, rautatieliikennepaikanNimi, liikennepaikkavaliHtml, googleMapsUrl, marker);
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

function haeLiikennepaikanNimiGeojsonista(tunniste) {
    const liikennepaikka = liikennepaikatData.features.find(feature => feature.properties.tunniste === tunniste);
    return liikennepaikka ? liikennepaikka.properties.nimi : null;
}

function haeLiikennepaikkavalinNimiGeojsonista(tunniste) {
    const liikennepaikkavali = liikennepaikkavalitData.features.find(feature => feature.properties.tunniste === tunniste);
    if (!liikennepaikkavali) return null;

    const alkuLiikennepaikanNimi = haeLiikennepaikanNimiGeojsonista(liikennepaikkavali.properties.alkuliikennepaikka);
    const loppuLiikennepaikanNimi = haeLiikennepaikanNimiGeojsonista(liikennepaikkavali.properties.loppuliikennepaikka);

    return alkuLiikennepaikanNimi && loppuLiikennepaikanNimi ? `${alkuLiikennepaikanNimi} - ${loppuLiikennepaikanNimi}` : null;
}

function lisaaResultItem(properties, liikennepaikanNimi, liikennepaikkavaliNimi, googleMapsUrl, marker) {
    const resultsDiv = document.getElementById('results');
    const item = document.createElement('table');
	const liikennepaikkaHtml = liikennepaikanNimi ? `<strong>Liikennepaikka:</strong> ${liikennepaikanNimi}<br>` : '';
    const liikennepaikkavaliHtml = liikennepaikkavaliNimi ? `${liikennepaikkavaliNimi}` : '';
    item.className = 'resultItem';
    item.innerHTML = `
	<table class="resultItem">
	 <tr>
	  <th><strong>+</strong></th>
	   <td>  
						${liikennepaikkaHtml}
						${liikennepaikkavaliHtml}	   
        <strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
        <strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
        <strong>Etäisyys radasta:</strong> ${properties.etaisyysRadastaMetria} metriä<br>
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
