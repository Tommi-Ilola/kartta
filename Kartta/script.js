let allMarkers = [];
let searchMarkers = [];
let ratanumerot = [];
let resultIndex = 0;
let currentResultNumber = 1;

function haeKaikkiRatanumerot() {
    naytaDatanLatausIndikaattori();
    fetch('/api/fetch-ratanumerot') // Käytä nyt taustafunktiota
        .then(response => response.json())
        .then(data => {
            ratanumerot = data.features.map(feature => feature.properties.ratanumero);
            console.log(ratanumerot);
            piilotaDatanLatausIndikaattori();
        })
        .catch(error => console.error('Virhe ladattaessa radat.geojson dataa:', error));
}

haeKaikkiRatanumerot();

function haeRatakilometrinSijainnit(ratakilometri) {
    let [ratakm, etaisyys] = ratakilometri.split('+').map(osa => osa.trim());
    etaisyys = etaisyys || '0';
    naytaLatausIndikaattori();

    const promises = ratanumerot.map(ratanumero => {
        const muokattuRatanumero = encodeURIComponent(ratanumero.trim());
        const url = `/infra-api/0.7/radat/${muokattuRatanumero}/${ratakm}+${etaisyys}.geojson`;
        console.log("Tehdään API-kutsu osoitteeseen:", url); // Lisätty console.log
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP-virhe! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error(`Virhe ladattaessa dataa ratanumerolle ${ratanumero}:`, error);
                return { status: 'rejected', reason: error };
            });
    });

  Promise.allSettled(promises).then(results => {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Tyhjennä ennen uusien tulosten lisäämistä
    let foundResults = false;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.features && result.value.features.length > 0) {
        result.value.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            const coordinates = feature.geometry.coordinates[0];
            if (Array.isArray(coordinates) && coordinates.length >= 2) {
              // Odotetaan, että kaupungin nimi haetaan ennen kuin jatketaan
              lisaaMarkerKartalle(coordinates, feature.properties.ratakmsijainti, (marker, markerId, cityName) => {

              });
            }
          }
        });
		foundResults = true;
	}
    });

  if (foundResults) {
    // Tuloksia löytyi, varmistetaan että resultsDiv on näkyvissä
    resultsDiv.style.display = 'block';
  } else {
    // Ei löytynyt tuloksia, näytetään viesti
    resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
    resultsDiv.style.display = 'block'; // Tämä varmistaa, että viesti tulee näkyviin
  }
  piilotaLatausIndikaattori();
}).catch(error => {
  console.error('Virhe ladattaessa kaikkia ratakilometrin sijainteja:', error);
  piilotaLatausIndikaattori();
});
}

function getCityFromCoordinates(lat, lon, callback) {
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(data => {
      let cityName = data.address.city || data.address.town || 'Ei tiedossa';
      callback(cityName);
    })
    .catch(error => {
      console.error("Error fetching city:", error);
      callback('Ei tiedossa');
    });
}

function luoTuloksenHTML(feature, cityName) {
  if (feature.properties && feature.properties.ratakmsijainti) {
    return `
      <table class="resultItem">
        <tr>
          <th><strong>${currentResultNumber++}.</strong></th>
          <td>
            <strong>Kaupunki:</strong> ${cityName}<br>
            <strong>Ratakm:</strong> ${feature.properties.ratakmsijainti.ratakm}+${feature.properties.ratakmsijainti.etaisyys}<br>
            <strong>Ratanumero:</strong> ${feature.properties.ratakmsijainti.ratanumero}
          </td>
        </tr>
      </table>`;
  } else {
    return '';
  }
}

function muunnaKoordinaatit(koordinaatit) {
    // Tarkista, että proj4 on ladattu
    if (typeof proj4 === 'undefined') {
        console.error('proj4-kirjastoa ei ole ladattu.');
        return null;
    }

    // Muunna koordinaatit EPSG:3067 (EUREF-FIN) -koordinaatistosta EPSG:4326 (WGS84) -koordinaatistoon
    return proj4(proj4.defs('EPSG:3067'), proj4.defs('EPSG:4326'), koordinaatit);
}


// Funktion, joka lisää tulokset sekä markerit
function lisaaTuloksetJaMarkerit(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    let foundResults = false;

    if (data.features && data.features.length > 0) {
        data.features.forEach(feature => {
            if (feature.geometry && feature.geometry.coordinates) {
                const coordinates = feature.geometry.coordinates[0];
                if (Array.isArray(coordinates) && coordinates.length >= 2) {
                    const markerId = lisaaMarkerKartalle(coordinates, feature.properties.ratakmsijainti);
                    lisaaTulosDiviin(feature, marker);
                    foundResults = true;
                }
            }
        });
    }

    if (foundResults) {
        resultsDiv.style.display = 'block';
    } else {
        resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
        resultsDiv.style.display = 'block';
    }
}

function lisaaMarkerKartalle(coordinates, ratakmsijainti, callback) {
  const muunnetutKoordinaatit = muunnaKoordinaatit(coordinates);
  if (muunnetutKoordinaatit) {
    const [lon, lat] = muunnetutKoordinaatit;
    
    // Haetaan kaupungin nimi ennen markerin luontia
    getCityFromCoordinates(lat, lon, (cityName) => {
      const customIcon = createNumberedIcon(currentResultNumber);
      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

      marker.bindPopup(`Kaupunki: ${cityName}<br>Ratakm: ${ratakmsijainti.ratakm}+${ratakmsijainti.etaisyys}<br>Ratanumero: ${ratakmsijainti.ratanumero}`);
      
      searchMarkers.push(marker);
      const markerId = searchMarkers.indexOf(marker);
      RemoveMarkersButton();
	  
      // Luodaan nyt resultItem markerin luonnin jälkeen, jotta se sisältää oikean markerId:n
      lisaaTulosDiviin(ratakmsijainti, cityName, markerId);
      if (callback) callback(marker, markerId, cityName);


    });
  } else {
    console.error('Koordinaattimuunnos epäonnistui:', coordinates);
  }
}

function lisaaTulosDiviin(ratakmsijainti, cityName, markerId) {
  const resultsDiv = document.getElementById('results');
  
  const resultItem = document.createElement('table');
  resultItem.className = 'resultItem';
  resultItem.innerHTML = `
    <tr>
      <th><strong>${currentResultNumber}.</strong></th>
      <td>
        <strong>Kaupunki:</strong> ${cityName}<br>
        <strong>Ratakm:</strong> ${ratakmsijainti.ratakm}+${ratakmsijainti.etaisyys}<br>
        <strong>Ratanumero:</strong> ${ratakmsijainti.ratanumero}
      </td>
    </tr>
  `;

  resultItem.dataset.markerId = markerId;
  
  resultItem.addEventListener('click', function() {
    const markerIndex = this.dataset.markerId;
    const selectedMarker = searchMarkers[markerIndex];
    if (selectedMarker) {
      map.setView(selectedMarker.getLatLng(), 13);
      selectedMarker.openPopup();
    }
  });

  resultsDiv.appendChild(resultItem);
  currentResultNumber++;
}

function createNumberedIcon(number) {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style='background-image: url(MyMarker.png);' class='marker-pin'></div>
           <span class='marker-number'>${number}</span>`,
    iconSize: [30, 42],
    iconAnchor: [14, 49],
    popupAnchor: [0, -42]
  });
}

function naytaDatanLatausIndikaattori() {
    document.getElementById('loadData').style.display = 'block';
}

function piilotaDatanLatausIndikaattori() {
    document.getElementById('loadData').style.display = 'none';
}

function naytaLatausIndikaattori() {
    document.getElementById('loading').style.display = 'block';
}

function piilotaLatausIndikaattori() {
    document.getElementById('loading').style.display = 'none';
}

function naytaVirheilmoitus(viesti) {
    const virheDiv = document.getElementById('virhe');
    virheDiv.innerHTML = viesti;
    virheDiv.style.display = 'block';
}

function piilotaVirheilmoitus() {
    document.getElementById('virhe').style.display = 'none';
}

function showCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>'; // Sulje-ikoni
}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier"><img src="magnifier.svg" style="width: 20px;height: 20px;"></span>'; // Suurennuslasi-ikoni
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Tyhjennä tulokset
    resultsDiv.style.display = 'none'; // Piilota tulokset
    showMagnifierIcon();
}

function RemoveMarkersButton() {
    const button = document.getElementById('removeMarkersButton');
    if (searchMarkers.length > 0) {
        button.style.display = 'block'; // Markkereita on, näytä painike
    } else {
        button.style.display = 'none'; // Ei markkereita, piilota painike
    }
}

function poistaKaikkiMarkerit() {
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];
	currentResultNumber = 1;
    RemoveMarkersButton(); // Päivitä painikkeen tila
}

document.getElementById('searchButton').addEventListener('click', function() {
	if (document.getElementById('results').style.display === 'block') {
		resetSearch();
	} else {
	const hakuInput = document.getElementById('searchInput').value;
		haeRatakilometrinSijainnit(hakuInput);
		showCloseIcon();
	}
});

document.getElementById('searchInput').addEventListener('keyup', function(event) {
	if (event.key === 'Enter' || event.keyCode === 13) {
	const hakuInput = document.getElementById('searchInput').value;
	haeRatakilometrinSijainnit(hakuInput);
	showCloseIcon();
	}
});

document.addEventListener('DOMContentLoaded', function() {
    RemoveMarkersButton(); // Päivitä painikkeen tila kun sivu on ladattu

    // Aseta tapahtumankuuntelija poistopainikkeelle
    const removeButton = document.getElementById('removeMarkersButton');
    if (removeButton) {
        removeButton.addEventListener('click', poistaKaikkiMarkerit);
    } else {
        console.error('RemoveMarkersButton-painiketta ei löydy');
    }
});

