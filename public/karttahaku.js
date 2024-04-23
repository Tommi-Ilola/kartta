let liikennepaikatData;
let liikennepaikkavalitData;
let klikkausLaskuri = 0;
let viimeisinMarker = null;
let mittausKaynnissa = false;

function showMeasureTool(e) {
    var measureControl = new L.Control.Measure({
		position: 'topleft',
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'sqmeters',
        secondaryAreaUnit: 'hectares'
    });
    measureControl.addTo(map);
    measureControl._startMeasure();
}

let measureControl = new L.Control.PolylineMeasure({
	position: 'topright',
    unit: 'metres',
    showBearings: false,
    clearMeasurementsOnStop: false,
    showClearControl: true,
    showUnitControl: true
}).addTo(map);

// Odotetaan, että kartta on kokonaan latautunut
map.whenReady(function() {
    let measureControlButton = document.querySelector('.polyline-measure-unicode-icon');

    if (measureControlButton) {
        measureControlButton.addEventListener('click', function() {
            mittausKaynnissa = !mittausKaynnissa;

            if (mittausKaynnissa) {
                map.off('click', mapClickEvent);
            } else {
                map.on('click', mapClickEvent);
            }
        });
    } else {
        console.error('Mittauskontrollin painiketta ei löydy.');
    }
});

let mapClickEvent = mapOnClick;

function toggleMeasureTool() {
    // Näytä tai piilota mittaustyökalu
    const measureBar = document.querySelector('.leaflet-right');
    if (measureBar.style.display === 'block') {
        measureBar.style.display = 'none';
    } else {
        measureBar.style.display = 'block';
    }
}

let avoinContextMenu;

function suljeContextMenu() {
    if (avoinContextMenu) {
        avoinContextMenu.remove();
        avoinContextMenu = null;
    }
}

map.on('contextmenu', function(e) {
    suljeContextMenu();

    e.originalEvent.preventDefault();

    const contextMenu = document.createElement('ul');
    contextMenu.id = 'map-context-menu';
    contextMenu.style.cursor = 'pointer';
    contextMenu.style.borderRadius = '0.5rem';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${e.containerPoint.x}px`;
    contextMenu.style.top = `${e.containerPoint.y}px`;
    contextMenu.style.listStyleType = 'none';
    contextMenu.style.padding = '10px';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #999';
    contextMenu.style.boxShadow = '3px 3px 5px #999';
    contextMenu.innerHTML = '<li>Etäisyyden mittaus</li>';
    document.body.appendChild(contextMenu);

    // Event listener for the context menu item click
    contextMenu.firstChild.addEventListener('click', function() {
        toggleMeasureTool();
        suljeContextMenu();
    });

    // Store the reference to the open context menu
    avoinContextMenu = contextMenu;

    // Stop the contextmenu event from reaching the map
    e.originalEvent.stopPropagation();
});

document.addEventListener('click', function(event) {
    if (!avoinContextMenu) return;
    if (!avoinContextMenu.contains(event.target)) {
        suljeContextMenu();
    }
});



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

async function alustaGeojsonData() {
    liikennepaikatData = await lataaGeojsonData('https://rata.digitraffic.fi/infra-api/0.7/rautatieliikennepaikat.geojson');
    liikennepaikkavalitData = await lataaGeojsonData('https://rata.digitraffic.fi/infra-api/0.7/liikennepaikkavalit.geojson');
}

alustaGeojsonData();

async function mapOnClick(e) {
    if (mittausKaynnissa) {
        // Mittaus on käynnissä, älä tee mitään
        return;
    }
	
	klikkausLaskuri++; // Kasvatetaan klikkauslaskuria jokaisella klikkauksella

    // Jos on pariton klikkaus, lisätään marker
    if (klikkausLaskuri % 2 !== 0) {
        const { lat, lng } = e.latlng;
        const googleMapsUrl = `https://www.google.com/maps/?q=${lat},${lng}`;
        const apiUrl = `https://rata.digitraffic.fi/infra-api/0.7/koordinaatit/${lat},${lng}.geojson?srsName=epsg:4326`;

    const tempPopupContent = "Haetaan tietoja...";
        
	viimeisinMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-image: url(MyClickMarker.png);' class='marker-pin'></div><span class='marker-number'>+</span>`,
            iconSize: [30, 42],
            iconAnchor: [15, 48],
            popupAnchor: [0, -48]
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

            viimeisinMarker.setPopupContent(popupContent);


        } else {
            viimeisinMarker.setPopupContent("Rata-alueen ulkopuolella.");
        }
    } catch (error) {
        console.error('Error while fetching data from API:', error);
        viimeisinMarker.setPopupContent("Virhe tietojen haussa.");
    }
    } else {
        // Jos klikkausLaskuri on parillinen, poista viimeisin marker ja tyhjennä result item
        if (viimeisinMarker) {
            map.removeLayer(viimeisinMarker);
            viimeisinMarker = null;
        }

    }
}

map.on('click', mapOnClick);

function tyhjennaResultItems() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
    isSearchActive = false;
}

function haeLiikennepaikanNimiGeojsonista(tunniste) {
    const liikennepaikka = liikennepaikatData.features.find(feature => feature.properties.tunniste === tunniste);
    return liikennepaikka ? liikennepaikka.properties.nimi : null;
}

async function haeLiikennepaikkavalinNimiGeojsonista(tunniste) {
    // Tarkista ensin, onko tunniste määritelty
    if (!tunniste) {
        return null;
    }

    // Etsi liikennepaikkaväli käyttäen tunnistetta
    const liikennepaikkavali = liikennepaikkavalitData.features.find(feature => feature.properties.tunniste === tunniste);
    if (!liikennepaikkavali) return null;

    const alkuLiikennepaikanNimi = haeLiikennepaikanNimiGeojsonista(liikennepaikkavali.properties.alkuliikennepaikka);
    const loppuLiikennepaikanNimi = haeLiikennepaikanNimiGeojsonista(liikennepaikkavali.properties.loppuliikennepaikka);

    return alkuLiikennepaikanNimi && loppuLiikennepaikanNimi ? `${alkuLiikennepaikanNimi} - ${loppuLiikennepaikanNimi}` : null;
}

function lisaaResultItem(properties, liikennepaikanNimi, liikennepaikkavaliNimi, googleMapsUrl, marker) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    const item = document.createElement('table');
	const liikennepaikkaHtml = liikennepaikanNimi ? `<strong>Liikennepaikka:</strong> ${liikennepaikanNimi}<br>` : '';
    const liikennepaikkavaliHtml = liikennepaikkavaliNimi ? `<strong>Liikennepaikkaväli:</strong> ${liikennepaikkavaliNimi}<br>` : '';
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

    item.addEventListener('click', function() {
        map.setView(marker.getLatLng(), 15);
        marker.openPopup();
    });

    resultsDiv.appendChild(item);
    resultsDiv.style.display = 'block';
	isSearchActive = true;
    showCloseIcon();
}

