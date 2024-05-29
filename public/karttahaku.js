let liikennepaikatData;
let liikennepaikkavalitData;
let klikkausLaskuri = 0;
let viimeisinMarker = null;
let mittausKaynnissa = false;
let piirtoKaynnissa = false;

function showMeasureTool(e) {
    var measureControl = new L.Control.Measure({
		position: 'topleft',
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'sqmeters',
        secondaryAreaUnit: 'hectares'
    });
	measureControl.setStyle({className: 'mitta'});
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

L.DomUtil.addClass(measureControl.getContainer(),'mitta')

let mapClickEvent = mapOnClick;

function toggleMeasureTool() {
    const measureBar = document.querySelector('.mitta');
    if (measureBar.style.display === 'block') {
        measureBar.style.display = 'none';
    } else {
        measureBar.style.display = 'block';
    }
}

function toggleGeocoder() {
    const geocoderBar = document.querySelector('.leaflet-control-geocoder');
    if (geocoderBar.style.display === 'block') {
        geocoderBar.style.display = 'none';
    } else {
        geocoderBar.style.display = 'block';
    }
}

function togglepmControls() {
    const pmDrawBar = document.querySelector('.leaflet-pm-draw');
    const pmEditBar = document.querySelector('.leaflet-pm-edit');
    
    if (pmDrawBar.style.display === 'block') {
        pmDrawBar.style.display = 'none';
    } else {
        pmDrawBar.style.display = 'block';
    }
    
    if (pmEditBar.style.display === 'block') {
        pmEditBar.style.display = 'none';
    } else {
        pmEditBar.style.display = 'block';
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
	
	const contextMenu = document.createElement('div');
    contextMenu.id = 'map-context-menu';
	contextMenu.style.fontFamily = 'Calibri';
    contextMenu.style.cursor = 'pointer';
    contextMenu.style.borderRadius = '0.5rem';
    contextMenu.style.position = 'absolute';
    contextMenu.style.left = `${e.containerPoint.x}px`;
    contextMenu.style.top = `${e.containerPoint.y}px`;
    contextMenu.style.listStyleType = 'none';
    contextMenu.style.padding = '0px';
    contextMenu.style.backgroundColor = 'white';
    contextMenu.style.border = '1px solid #999';
    contextMenu.style.boxShadow = '3px 3px 5px #999';
	
	const measureItem = document.createElement('div');
	measureItem.innerHTML = 'Etäisyyden mittaus';
	measureItem.className = 'context-menu-item';
	contextMenu.appendChild(measureItem);

	const geocoderItem = document.createElement('div');
	geocoderItem.innerHTML = 'Osoitehaku';
	geocoderItem.className = 'context-menu-item';
	contextMenu.appendChild(geocoderItem);

	const pmControlsItem = document.createElement('div');
	pmControlsItem.innerHTML = 'Piirtotyökalut';
	pmControlsItem.className = 'context-menu-item';
	contextMenu.appendChild(pmControlsItem);

	document.body.appendChild(contextMenu);

    contextMenu.firstChild.addEventListener('click', function() {
        toggleMeasureTool();
        suljeContextMenu();
    });

    const geocoderMenuItem = contextMenu.children[1];
    geocoderMenuItem.addEventListener('click', function() {
        toggleGeocoder();
        suljeContextMenu();
    });
	
    const pmControlsMenuItem = contextMenu.children[2];
    pmControlsMenuItem.addEventListener('click', function() {
        togglepmControls();
        suljeContextMenu();
    });	

    avoinContextMenu = contextMenu;

    e.originalEvent.stopPropagation();
});

document.addEventListener('click', function(event) {
    if (!avoinContextMenu) return;
    if (!avoinContextMenu.contains(event.target)) {
        suljeContextMenu();
    }
});

var searchMarker;

var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false
}).on('markgeocode', function(e) {
    // Aseta marker, kuten aiemmin
    searchMarker = L.marker(e.geocode.center).addTo(map)
        .bindPopup(e.geocode.name)
        .openPopup();

    // Muuta suurennuslasin ikonia "X" ikoniksi
    var geocoderIcon = document.querySelector('.leaflet-control-geocoder-icon');
    geocoderIcon.classList.add('leaflet-control-geocoder-icon-close');

function handleGeocoderIconClick() {
    if (searchMarker) {
        map.removeLayer(searchMarker); // Poista marker kartalta
        searchMarker = null;
    }
    // Tyhjennä hakukenttä
    document.querySelector('.leaflet-control-geocoder-form input').value = '';

    // Palauta alkuperäinen suurennuslasin ikoni
    var geocoderIcon = document.querySelector('.leaflet-control-geocoder-icon');
    geocoderIcon.classList.remove('leaflet-control-geocoder-icon-close');
    geocoderIcon.removeEventListener('click', handleGeocoderIconClick);
}

geocoderIcon.addEventListener('click', handleGeocoderIconClick);

}).addTo(map);

map.pm.addControls({
  position: 'topright',
  drawCircle: false, 
});

function checkToolActive() {
    const pmContainer = document.querySelector('.button-container.active');
    if (pmContainer && window.getComputedStyle(pmContainer).display !== 'none') {
        return true;
    }
    return false;
}

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
    if (checkToolActive()) {
        console.log('Ttyökalu aktiivinen, klikkausta ei käsitellä.');
        return;
    }
	
	if (avoinContextMenu) {
        console.log('Valikko aktiivinen, klikkausta ei käsitellä.');
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
            html: `<div style='background-image: url(MyClickMarker.png);' class='marker-pin'></div><span class='marker-number'></span>`,
            iconSize: [30, 42],
            iconAnchor: [15, 48],
            popupAnchor: [-1, -48]
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
