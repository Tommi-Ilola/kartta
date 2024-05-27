let allMarkers = [];
let searchMarkers = [];
let geoJsonLayers = [];
let ratanumerot = [];
let resultIndex = 0;
let currentResultNumber = 1;
let isSearchActive = false;

function haeKaikkiRatanumerot() {
    naytaDatanLatausIndikaattori();
	piilotaDatanLatausIndikaattori();
    const url = 'https://rata.digitraffic.fi/infra-api/0.8/radat.geojson';
	
    console.log("Tehdään API-kutsu osoitteeseen:", url); // Lisätty console.log
    fetch(url)
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

    const MAX_CONCURRENT_REQUESTS = 174;
    let activeRequests = 0;
    let currentIndex = 0;
    let foundResults = false;

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Tyhjennä aiemmat tulokset

    const processNextBatch = () => {
        while (activeRequests < MAX_CONCURRENT_REQUESTS && currentIndex < ratanumerot.length) {
            const ratanumero = ratanumerot[currentIndex++];
            const muokattuRatanumero = encodeURIComponent(ratanumero.trim());
            const url = `https://rata.digitraffic.fi/infra-api/0.8/radat/${muokattuRatanumero}/${ratakm}+${etaisyys}.geojson`;
            console.log("Tehdään API-kutsu osoitteeseen:", url);

            activeRequests++;
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP-virhe! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        foundResults = true;
                        data.features.forEach(feature => {
                            if (feature.geometry && feature.geometry.coordinates) {
                                const coordinates = feature.geometry.coordinates[0];
                                if (Array.isArray(coordinates) && coordinates.length >= 2) {
                                    lisaaMarkerKartalle(coordinates, feature.properties.ratakmsijainti);
                                }
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error(`Virhe ladattaessa dataa ratanumerolle ${ratanumero}:`, error);
                })
                .finally(() => {
                    activeRequests--;
                    if (currentIndex >= ratanumerot.length && activeRequests === 0) {
                        piilotaLatausIndikaattori();
                        if (!foundResults) {
                            resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
                        }
                        resultsDiv.style.display = 'block'; // Näytä tulokset, oli niitä tai ei
                    }
                });
        }
        if (activeRequests < MAX_CONCURRENT_REQUESTS && currentIndex < ratanumerot.length) {
            processNextBatch(); // Käsittele seuraava erä pyyntöjä
        }
    };

    processNextBatch(); // Aloita pyyntöjen käsittely
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

function haeRatakilometriValinSijainnit(ratakilometriVali) {
    naytaLatausIndikaattori();
	currentMarkerNumber = 1;

    // Erota syöte ratakm ja etäisyys osiin ja muodosta niistä URL
    const valiOsat = ratakilometriVali.split('-');
    if (valiOsat.length === 2) {
        const alkuOsa = valiOsat[0].split('+');
        const loppuOsa = valiOsat[1].split('+');
        const ratakm1 = alkuOsa[0].trim();
        const etaisyys1 = alkuOsa[1] ? alkuOsa[1].trim() : '0';
        const ratakm2 = loppuOsa[0].trim();
        const etaisyys2 = loppuOsa[1] ? loppuOsa[1].trim() : '0';

        // Tulosta debuggausviestit varmistaaksesi, että osat on eroteltu oikein
        console.log(`Alku: ratakm1 = ${ratakm1}, etaisyys1 = ${etaisyys1}`);
        console.log(`Loppu: ratakm2 = ${ratakm2}, etaisyys2 = ${etaisyys2}`);

        ratanumerot.forEach(ratanumero => {
            const muokattuRatanumero = encodeURIComponent(ratanumero);
            const url = `https://rata.digitraffic.fi/infra-api/0.8/radat/${muokattuRatanumero}/${ratakm1}+${etaisyys1}-${ratakm2}+${etaisyys2}.geojson`;
            console.log("Tehdään API-kutsu osoitteeseen:", url);

            fetch(url)
                .then(response => response.json())
                .then(data => {
					piilotaLatausIndikaattori();
					naytaDatanTiedotResultsDivissa(data); // Näytä data results-divissä
					visualisoiGeojsonDataKartalla(data); // Visualisoi data kartalla
				})
                .catch(error => {
                    console.error(`Virhe ladattaessa dataa ratanumerolle ${ratanumero}:`, error);
                    piilotaLatausIndikaattori();
                });
        });
    } else {
        console.error('Syötteen muoto on virheellinen. Odotetaan muotoa "ratakm+etaisyys-ratakm+etaisyys".');
        piilotaLatausIndikaattori();
    }
}

function haeRatakilometrinSijainnitJaLisaaMarkerit(ratakm, etaisyys, ratanumero) {
    // Muodosta URL käyttäen ratakm, etaisyys ja ratanumero arvoja
    const url = `https://rata.digitraffic.fi/infra-api/0.8/radat/${encodeURIComponent(ratanumero)}/${ratakm}+${etaisyys}.geojson`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP-virhe! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Tarkista, löytyykö koordinaatteja vastaava data
            if (data.features.length > 0) {
                const coordinates = data.features[0].geometry.coordinates[0];
                lisaaValiMarkerKartalle(coordinates, {
                    ratakm: ratakm,
                    etaisyys: etaisyys,
                    ratanumero: ratanumero
                });
            }
        })
        .catch(error => {
            console.error(`Virhe ladattaessa dataa ratanumerolle ${ratanumero}:`, error);
        });
}

function naytaDatanTiedotResultsDivissa(data) {
    const resultsDiv = document.getElementById('results');
	resultsDiv.style.display = 'block';

    if (data.features && data.features.length > 0) {

    } else {
        resultsDiv.innerHTML = '<p>Ei tuloksia</p>';
    }
}

function visualisoiGeojsonDataKartalla(data) {
    const resultsDiv = document.getElementById('results');

    let index = 0;

    const layer = L.geoJSON(data, {
        style: function (feature) {
            return {
                color: "#3388ff",
                weight: 15,
                opacity: 0.5
            };
        },

        onEachFeature: function (feature, layer) {
            const tooltipText = ` ${currentResultNumber}.`;
            const item = document.createElement('table');
            item.className = 'resultItem';
            item.dataset.index = index++; // Tallenna indeksi
            const properties = feature.properties;
            item.innerHTML = `
                <table class="resultItem" data-index="${index}">
                    <tr>
                        <th><strong>${currentResultNumber++}.</strong></th>
                        <td>
                            <strong>Ratanumero:</strong> ${properties.ratanumero}<br>
                            <strong>Alku:</strong> km ${properties.alku.ratakm}+${properties.alku.etaisyys}<br>
                            <strong>Loppu:</strong> km ${properties.loppu.ratakm}+${properties.loppu.etaisyys}<br>
                            <strong>Pituus:</strong> ${properties.pituus} metriä
                        </td>
                    </tr>
                </table>
            `;

            const bounds = layer.getBounds();
            const width = bounds.getEast() - bounds.getWest();
            const height = bounds.getNorth() - bounds.getSouth();
            const direction = width > height ? 'top' : 'left'; // Adjust tooltip direction based on orientation

            layer.bindTooltip(tooltipText, {
                permanent: true,
                direction: direction,
                className: 'search-tooltip',
                offset: direction === 'top' ? [0, -10] : [-10, 0] // Adjust offset based on direction
            });

            item.addEventListener('click', function () {
                map.fitBounds(layer.getBounds());
                highlightLayer(layer);
            });

            resultsDiv.appendChild(item);

            if (feature.properties && feature.properties.alku && feature.properties.loppu && feature.properties.pituus) {
                const alku = feature.properties.alku;
                const loppu = feature.properties.loppu;
                const pituus = feature.properties.pituus;

                const alkuLat = alku.lat; // Oleta, että tämä on saatavilla
                const alkuLon = alku.lon; // Oleta, että tämä on saatavilla
                const loppuLat = loppu.lat; // Oleta, että tämä on saatavilla
                const loppuLon = loppu.lon; // Oleta, että tämä on saatavilla

                const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${alkuLat},${alkuLon}&destination=${loppuLat},${loppuLon}&travelmode=driving`;

                const popupContent = `
                    <strong>Ratakilometriväli:</strong><br>
                    km ${alku.ratakm}+${alku.etaisyys}
                    - ${loppu.ratakm}+${loppu.etaisyys}<br>
                    <strong>Pituus:</strong> ${pituus} metriä<br>
                    <a href="${googleMapsUrl}" target="_blank">Avaa Google Mapsissa</a>
                `;

                layer.bindPopup(popupContent);
            }
        },
        coordsToLatLng: function (coords) {
            const [lon, lat] = proj4("EPSG:3067", "EPSG:4326", [coords[0], coords[1]]);
            return [lat, lon];
        }
    }).addTo(map);

    geoJsonLayers.push(layer);
    RemoveMarkersButton();

    let featureGroup = L.featureGroup(geoJsonLayers);
    if (featureGroup.getLayers().length > 0) {
        map.fitBounds(featureGroup.getBounds());
    }

    function highlightLayer(layer) {
        resetAllLayersStyle();
        layer.setStyle({
            color: '#5eff00',
            weight: 15,
            opacity: 0.7
        });
    }

    function resetAllLayersStyle() {
        geoJsonLayers.forEach(layer => {
            layer.setStyle({
                color: "#3388ff",
                weight: 15,
                opacity: 0.5
            });
        });
    }
}

function lisaaAlkuJaLoppuPisteetGeoJsonista(data) {
    data.features.forEach(feature => {
        // Oletetaan, että koordinaatit ovat ensimmäisen ja viimeisen pisteen koordinaatit
        const alkuKoordinaatit = feature.geometry.coordinates[0][0];
        const loppuKoordinaatit = feature.geometry.coordinates[0][feature.geometry.coordinates[0].length - 1];

        // Muunna koordinaatit EPSG:3067 -> EPSG:4326
        const alkuLatLng = proj4(proj4.defs('EPSG:3067'), proj4.defs('EPSG:4326'), alkuKoordinaatit);
        const loppuLatLng = proj4(proj4.defs('EPSG:3067'), proj4.defs('EPSG:4326'), loppuKoordinaatit);

        // Lisää markkerit kartalle
        const alkuMarker = L.marker([alkuLatLng[1], alkuLatLng[0]]).addTo(map);
        const loppuMarker = L.marker([loppuLatLng[1], loppuLatLng[0]]).addTo(map);

        // Aseta popupit markkereille
        alkuMarker.bindPopup(`Alkupiste: km ${feature.properties.alku.ratakm}+${feature.properties.alku.etaisyys}`);
        loppuMarker.bindPopup(`Loppupiste: km ${feature.properties.loppu.ratakm}+${feature.properties.loppu.etaisyys}`);

        // Tallenna markerit niiden poistamiseksi tarvittaessa
        searchMarkers.push(alkuMarker, loppuMarker);
    });
}

function naytaTuloksetResultsDivissa(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // Tyhjennä aiemmat tulokset

    data.features.forEach((feature, index) => {
        const properties = feature.properties;
        const item = document.createElement('div');
        item.className = 'resultItem';
        item.dataset.index = index; // Tallenna geometrian indeksi data-attribuuttiin
        item.innerHTML = `
            <h4>Feature ${index + 1}</h4>
            <p>Ratanumero: ${properties.ratanumero}</p>
            <p>Alku: ${properties.alku.ratakm}+${properties.alku.etaisyys}</p>
            <p>Loppu: ${properties.loppu.ratakm}+${properties.loppu.etaisyys}</p>
            <p>Pituus: ${properties.pituus} metriä</p>
        `;

        item.addEventListener('click', function() {
            // Hae klikatun elementin indeksi
            const featureIndex = this.dataset.index;
            const selectedFeature = data.features[featureIndex];
            if (selectedFeature) {
                // Käytä valitun geometrian koordinaatteja keskittääksesi kartan
                const bounds = L.geoJSON(selectedFeature.geometry).getBounds();
                map.fitBounds(bounds);
            }
        });

        resultsDiv.appendChild(item);
    });

    if (data.features.length === 0) {
        resultsDiv.innerHTML = '<p>Ei hakutuloksia</p>';
    }
}

function naytaGeometriatKartalla(data) {
    data.features.forEach(feature => {
        const geometry = feature.geometry;
        if (geometry.type === 'MultiLineString') {
            geometry.coordinates.forEach(lineString => {
                const latLngs = lineString.map(coord => {
                    // Muunna koordinaatit EPSG:3067:stä EPSG:4326:een
                    const [lon, lat] = proj4(proj4.defs('EPSG:3067'), proj4.defs('EPSG:4326'), coord);
                    return [lat, lon];
                });
                // Lisää polyline kartalle Leafletin avulla
                L.polyline(latLngs, {color: 'red'}).addTo(map);
            });
        }
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

      // Lisää Google Maps linkki
      const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

      marker.bindPopup(`
        Kaupunki: ${cityName}<br>
        Ratakm: ${ratakmsijainti.ratakm}+${ratakmsijainti.etaisyys}<br>
        Ratanumero: ${ratakmsijainti.ratanumero}<br>
        <a href="${googleMapsLink}" target="_blank">Avaa Google Mapsissa</a>
      `);
      
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
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>';
}

function hideCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier"><img src="magnifier.svg" style="width: 20px;height: 20px;"></span>';
}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier"><img src="magnifier.svg" style="width: 20px;height: 20px;"></span>';
}

function naytaVirheilmoitus(viesti) {
    const virheDiv = document.getElementById('virhe');
    virheDiv.innerText = viesti;
    virheDiv.style.display = 'block';
}

function RemoveMarkersButton() {
    let isMarkersPresent = searchMarkers.length > 0;
    let isLayersPresent = geoJsonLayers.length > 0;
    let button = document.getElementById('removeMarkersButton');
    if (button) {
        if (isMarkersPresent || isLayersPresent) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    } else {
        console.error('Poista markerit -painiketta ei löydy');
    }
}

function poistaKaikkiMarkerit() {
    searchMarkers.forEach(marker => map.removeLayer(marker));
    searchMarkers = [];

    geoJsonLayers.forEach(layer => map.removeLayer(layer));
    geoJsonLayers = [];

    if (window.searchResultsLayer) {
        map.removeLayer(window.searchResultsLayer);
        window.searchResultsLayer = null;
    }
    RemoveMarkersButton();
    currentResultNumber = 1;
}

document.getElementById('searchButton').addEventListener('click', function(event) {
    event.preventDefault();
    if (isSearchActive && this.innerHTML.includes('close-icon')) {
        resetSearch();
    } else {
        performSearch();
    }
});

document.getElementById('searchInput').addEventListener('keyup', function(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        performSearch();
    }
});

function performSearch() {
    let searchTerm = document.getElementById('searchInput').value.trim();
    if (!searchTerm) {
        console.error('Hakukenttä on tyhjä');
        naytaVirheilmoitus('Syötä hakutermi');
        return;
    }

    if (searchTerm.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)) {
        const [lat, lng] = searchTerm.split(',').map(Number);
        haeTiedotKoordinaateistaJaLisaaMarker(lat, lng);
    } else if (searchTerm.match(/^\d+(\+\d+)?-\d+(\+\d+)?$/)) {
        haeRatakilometriValinSijainnit(searchTerm);
    } else if (searchTerm.includes('+') || !isNaN(searchTerm)) {
        haeRatakilometrinSijainnit(searchTerm);
    } else {
        searchLocation(searchTerm);
    }
}

function resetSearch() {
    document.getElementById('searchInput').value = '';
    clearResults();
    showMagnifierIcon();
    isSearchActive = false;
    hideCloseIcon();
    poistaKaikkiMarkerit();
}

function clearResults() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
}

function showMagnifierIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier"><img src="magnifier.svg" style="width: 20px;height: 20px;"></span>';
}

function hideCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="magnifier"><img src="magnifier.svg" style="width: 20px;height: 20px;"></span>';
}

function showCloseIcon() {
    const searchButton = document.getElementById('searchButton');
    searchButton.innerHTML = '<span class="close-icon">&#x2715;</span>';
}

document.addEventListener('DOMContentLoaded', function() {
    const removeButton = document.getElementById('removeMarkersButton');
    if (removeButton) {
        removeButton.addEventListener('click', poistaKaikkiMarkerit);
    } else {
        console.log('RemoveMarkersButton-painiketta ei löydy');
    }
});

async function haeTiedotKoordinaateistaJaLisaaMarker(lat, lng) {
    const googleMapsUrl = `https://www.google.com/maps/?q=${lat},${lng}`;
    const apiUrl = `https://rata.digitraffic.fi/infra-api/0.7/koordinaatit/${lat},${lng}.geojson?srsName=epsg:4326`;

    const tempPopupContent = "Haetaan tietoja...";
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-image: url(MyCcMarker.png);' class='marker-pin'></div><span class='marker-number'></span>`,
            iconSize: [30, 42],
            iconAnchor: [15, 48],
            popupAnchor: [0, -48]
        })
    }).addTo(map).bindPopup(tempPopupContent).openPopup();
	searchMarkers.push(marker);

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
	RemoveMarkersButton();
}
