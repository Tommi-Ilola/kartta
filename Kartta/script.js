let allMarkers = [];
let searchMarkers = [];
let currentCity = ""; // Määritetään ulkoinen muuttuja kaupungin nimelle
let removeButton = createRemoveMarkersButton();

function getCityFromCoordinates(lat, lon, callback) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            let foundCity = null;
            if (data && data.address) {
                foundCity = data.address.city || data.address.town;
            }
            callback(foundCity);
        })
        .catch(error => {
            console.error("Error fetching city:", error);
            callback(null);
        });
}

function resetMarkerStyles() {
    allMarkers.forEach(marker => {
        marker.setStyle({
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
			radius: 3
        });
    });
}

function parseRatakmValue(value) {
    const stringValue = value.toString();

    const parts = stringValue.split("+");
    if (parts.length == 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 1000;
    } else {
        return parseFloat(stringValue);
    }
}



function highlightMarker(marker) {
	resetMarkerStyles(); // Palautetaan ensin muiden markerien värit

    // Korostetaan valittu marker
    marker.setStyle({
        color: '#333',
        fillColor: 'blue',
        fillOpacity: 0.8,
		radius: 5
    });
	
    marker.bringToFront();
    map.setView(marker.getLatLng(), 11); // Keskitytään markeriin ja zoomataan lähemmäs
}

function showMarkersByRatakm(ratakmValue) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resetMarkerStyles();

    let found = false;
    const parsedSearchValue = parseRatakmValue(ratakmValue);

    allMarkers.forEach(marker => {
        const featureProps = marker.featureProperties;
        const markerRatakm = parseRatakmValue(featureProps.ratakm.toString());

        if (Math.abs(markerRatakm - parsedSearchValue) < 0.001) {
            found = true;
            const lat = marker.getLatLng().lat;
            const lon = marker.getLatLng().lng;

            // Hae kaupunki ja päivitä tulokset riippumatta haun tuloksesta
            getCityFromCoordinates(lat, lon, (city) => {
                const resultItem = document.createElement('div');
                resultItem.className = 'resultItem';
                resultItem.innerHTML = `
                    <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
                    <strong>Ratakm:</strong> ${featureProps.ratakm}<br>
                    <strong>Ratanumero:</strong> ${featureProps.ratanumero || 'Ei määritelty'}
                `;

                // Lisää data-attribuutti markerin indeksillä
                resultItem.setAttribute('data-marker-index', allMarkers.indexOf(marker));

                // Lisää kuuntelija, joka korostaa markerin kun tulosta klikataan
                resultItem.addEventListener('click', function() {
                    highlightMarker(marker);
                });

                resultsDiv.appendChild(resultItem);
            });
        }
	});
	// Näytä viesti, jos tuloksia ei löydy
	if (!found) {
		resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
	}

	// Näytä results-div
	resultsDiv.style.display = 'block';

	// Varmista, että poistopainike on olemassa ja näkyvissä
	let removeButton = document.getElementById('removeMarkersButton');
	if (!removeButton) {
		removeButton = document.createElement('button');
		removeButton.id = 'removeMarkersButton';
		removeButton.textContent = 'Poista merkit kartalta';
		removeButton.addEventListener('click', clearSearchMarkers);
		resultsDiv.appendChild(removeButton);
	}
	removeButton.style.display = 'block';
}

// Oletetaan, että olet jo tuonut ja tallentanut kaikki ratakilometrit allMarkers-muuttujaan
// ja että jokaisella markerilla on featureProperties, joka sisältää kyseisen ratakilometrin tiedot

function findMarkersByRatanumero(ratanumero) {
  // Filtteröi kaikki markerit, jotka vastaavat annettua ratanumeroa
  return allMarkers.filter(marker => marker.featureProperties.ratanumero === ratanumero);
}

function findAndShowIntermediatePoint(searchValue) {
    document.getElementById('results').innerHTML = '';
    const resultsDiv = document.getElementById('results');
    const parsedSearchValue = parseRatakmValue(searchValue);
    const baseKm = Math.floor(parsedSearchValue);
    const fraction = parsedSearchValue - baseKm;
    const ratanumerot = allMarkers.map(marker => marker.featureProperties.ratanumero);
    const uniqueRatanumerot = [...new Set(ratanumerot)];
    let found = false;

    uniqueRatanumerot.forEach(ratanumero => {
        const markers = findMarkersByRatanumero(ratanumero);
        markers.sort((a, b) => parseRatakmValue(a.featureProperties.ratakm) - parseRatakmValue(b.featureProperties.ratakm));
    
    for (let i = 0; i < markers.length - 1; i++) {
        const currentKm = parseRatakmValue(markers[i].featureProperties.ratakm);
        const nextKm = parseRatakmValue(markers[i + 1].featureProperties.ratakm);
        if (currentKm <= baseKm && nextKm >= baseKm + 1) {
            const interpolatedLatLng = interpolateLatLng(
                markers[i].getLatLng(),
                markers[i + 1].getLatLng(),
                fraction
            );

            // Luo markeri interpoloidulle sijainnille ja lisää se kartalle
            const popupMarker = L.marker(interpolatedLatLng).addTo(map);
            popupMarker.bindPopup(`Ratakm: ${searchValue} Ratanumero: ${ratanumero}`);
            searchMarkers.push(popupMarker); // Lisää marker hakutulosten markerien joukkoon

            // Luo ja lisää tulostietue
            updateResultsDivWithIntermediatePoints(searchValue, interpolatedLatLng, ratanumero);
            found = true;
            break;
        }
    }
});

if (!found) {
    resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
}

// Näytä results-div
resultsDiv.style.display = 'block';

// Luo tai päivitä poistopainiketta
let removeButton = document.getElementById('removeMarkersButton');
if (!removeButton) {
    removeButton = document.createElement('button');
    removeButton.id = 'removeMarkersButton';
    removeButton.textContent = 'Poista merkit kartalta';
    removeButton.addEventListener('click', clearSearchMarkers);
    resultsDiv.appendChild(removeButton);
}
    if (searchMarkers.length > 0) {
        document.getElementById('removeMarkersButton').style.display = 'block'; // Näytä painike
    }
    updateRemoveButtonVisibility();
}

function updateResultsDivWithIntermediatePoints(searchValue, latLng, ratanumero) {
    const resultsDiv = document.getElementById('results');
    
    getCityFromCoordinates(latLng.lat, latLng.lng, (city) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'resultItem';
        resultItem.innerHTML = `
            <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
            <strong>Ratakm:</strong> ${searchValue}<br>
            <strong>Ratanumero:</strong> ${ratanumero}
        `;

        // Luo marker tai hae olemassa oleva
        const popupMarker = L.marker([latLng.lat, latLng.lng]).addTo(map);
        popupMarker.bindPopup(`
            <strong>Kaupunki:</strong> ${city || 'Ei tiedossa'}<br>
            <strong>Ratakm:</strong> ${searchValue}<br>
            <strong>Ratanumero:</strong> ${ratanumero}
        `);

        // Lisää marker hakutulosten markerien joukkoon
        searchMarkers.push(popupMarker);

        // Lisää data-attribuutit
        resultItem.setAttribute('data-lat', latLng.lat);
        resultItem.setAttribute('data-lng', latLng.lng);

        // Kuuntelija klikkaustapahtumalle
		resultItem.addEventListener('click', function() {
			if (window.matchMedia("(max-width: 900px)").matches) {
				const mapHeight = document.getElementById('map').clientHeight; // Kartan korkeus
				const offsetPixels = mapHeight / 4; // Määritä offset, esimerkiksi 1/4 kartan korkeudesta

				const markerLatLng = popupMarker.getLatLng();
				const point = map.latLngToContainerPoint(markerLatLng);
				point.y -= offsetPixels
				const newLatLng = map.containerPointToLatLng(point);
				
				map.setView(newLatLng, 20);
				map.setView(newLatLng, 11); // Keskity uuteen sijaintiin ja aseta zoomaustaso
			} else {
				// Ei-mobiililaitteiden logiikka: keskitetään marker näytön keskelle
				map.setView(popupMarker.getLatLng(), 20);
				map.setView(popupMarker.getLatLng(), 11);
			}
			popupMarker.openPopup();
		});
		
        resultsDiv.appendChild(resultItem);

        // Luo poistopainike, jos sitä ei ole vielä olemassa
        let removeButton = document.getElementById('removeMarkersButton');
        if (!removeButton) {
            removeButton = document.createElement('button');
            removeButton.id = 'removeMarkersButton';
            removeButton.textContent = 'Poista merkit kartalta';
            removeButton.addEventListener('click', clearSearchMarkers);
            resultsDiv.appendChild(removeButton);
        }

        // Näytä poistopainike
        removeButton.style.display = 'block';
    });
}


function interpolateLatLng(latlng1, latlng2, fraction) {
    const lat = latlng1.lat + (latlng2.lat - latlng1.lat) * fraction;
    const lng = latlng1.lng + (latlng2.lng - latlng1.lng) * fraction;
    return L.latLng(lat, lng);
}

// Luo "Poista markerit" -painike kartan yhteyteen tai muuhun sopivaan paikkaan
function createRemoveMarkersButton() {
    let removeButton = document.getElementById('removeMarkersButton');
    if (!removeButton) {
        removeButton = document.createElement('button');
        removeButton.id = 'removeMarkersButton';
        removeButton.textContent = 'Poista merkit kartalta';
        removeButton.style.display = 'none'; // Piilota aluksi
        removeButton.addEventListener('click', clearSearchMarkers);

        // Lisää painike karttaelementin yhteyteen tai muuhun sopivaan paikkaan
        document.body.appendChild(removeButton); // Vaihda tämä sopivaan paikkaan
    }
    return removeButton;
}

// Kutsu tätä funktiota, kun sovellus käynnistyy


function updateRemoveButtonVisibility() {
    if (searchMarkers.length > 0) {
        removeButton.style.display = 'block';
    } else {
        removeButton.style.display = 'none';
    }
}

function clearSearchMarkers() {
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];
    updateRemoveButtonVisibility(); // Päivitä painikkeen näkyvyys
}

function showCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>'; // Sulje-ikoni

}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier-icon">&#x1F50E;&#xFE0E;</span>'; // Suurennuslasi-ikoni
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    resetMarkerStyles();
    document.getElementById('results').style.display = 'none';
    showMagnifierIcon();
}

// Kun käyttäjä suorittaa haun
document.getElementById('searchButton').addEventListener('click', function() {
	if (document.getElementById('results').style.display === 'block') {
		resetSearch();
	} else {
	const searchValue = document.getElementById('searchInput').value;
		findAndShowIntermediatePoint(searchValue);
		showCloseIcon();
	}
});

// Olemassa olevaan kuuntelijaan enterille
document.getElementById('searchInput').addEventListener('keyup', function(event) {
	if (event.key === 'Enter' || event.keyCode === 13) {
	const searchValue = document.getElementById('searchInput').value;
	findAndShowIntermediatePoint(searchValue);
	showCloseIcon();
	}
});

createRemoveMarkersButton();

