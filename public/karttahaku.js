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

async function mapOnClick(e) {
    const { lat, lng } = e.latlng;
    const googleMapsUrl = `https://www.google.com/maps/?q=${lat},${lng}`;
    const apiUrl = `https://rata.digitraffic.fi/infra-api/0.7/koordinaatit/${lat},${lng}.geojson?srsName=epsg:4326`;

    const tempPopupContent = "Haetaan tietoja...";
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-image: url(MyClickMarker.png);' class='marker-pin'></div><span class='marker-number'>+</span>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
            popupAnchor: [0, -42]
        })
    }).addTo(map).bindPopup(tempPopupContent).openPopup();

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const properties = data.features[0].properties;
            const rautatieliikennepaikanTunniste = properties.rautatieliikennepaikka;
            const liikennepaikkavalinTunniste = properties.liikennepaikkavali;

            let rautatieliikennepaikanNimi = await haeLiikennepaikanNimiGeojsonista(rautatieliikennepaikanTunniste);
            let liikennepaikkavalinNimi = await haeLiikennepaikkavalinNimiGeojsonista(liikennepaikkavalinTunniste);

            let liikennepaikkaHtml = rautatieliikennepaikanNimi ? `<strong>Liikennepaikka:</strong> ${rautatieliikennepaikanNimi}<br>` : '';
            let liikennepaikkavaliHtml = liikennepaikkavalinNimi ? `<strong>Liikennepaikkaväli:</strong> ${liikennepaikkavalinNimi}<br>` : '';

            let popupContent = `
				${liikennepaikkaHtml}
				${liikennepaikkavaliHtml}	   
				<strong>Ratanumero:</strong> ${properties.ratakmsijainnit.map(r => r.ratanumero).join(', ')}<br>
				<strong>Ratakm:</strong> ${properties.ratakmsijainnit.map(r => `${r.ratakm}+${r.etaisyys}`).join(', ')}<br>
				<strong>Etäisyys radasta:</strong> ${properties.etaisyysRadastaMetria} metriä<br>
                <a href="${googleMapsUrl}" target="_blank">Avaa Google Mapsissa</a>
            `;

            marker.setPopupContent(popupContent);

            lisaaResultItem(properties, rautatieliikennepaikanNimi, liikennepaikkavalinNimi, googleMapsUrl, marker);
        } else {
            marker.setPopupContent("Rata-alueen ulkopuolella.");
        }
    } catch (error) {
        console.error('Error while fetching data from API:', error);
        marker.setPopupContent("Virhe tietojen haussa.");
    }

    searchMarkers.push(marker);
    RemoveMarkersButton();
}

map.on('click', mapOnClick);

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
    isSearchActive = true;
    showCloseIcon();
}
