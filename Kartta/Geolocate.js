let userMarker, userHeadingMarker;
let watchID;
let isTracking = false;
let userIcon = L.icon({
    iconUrl: 'arrow-icon.png', // Korvaa tämä polku nuolen kuvan polulla
    iconSize: [24, 24], // Aseta sopiva koko
    iconAnchor: [12, 12], // Oletetaan, että nuoli on keskitetty
    className: 'user-marker-icon' // Käytä määriteltyä luokkaa
});

function updateUserMarker(lat, lon, heading) {
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
        if (heading !== null && heading !== undefined) {
            // Käytä Leafletin sisäänrakennettua funktiota transformaation asettamiseen
            L.DomUtil.setTransform(userMarker._icon, null, heading);
        }
    } else {
        userMarker = L.marker([lat, lon], {icon: userIcon}).addTo(map);
    }
}

function startTracking() {
    if (isTracking) {
        // Jos seuranta on jo päällä, lopeta se ja poista merkki
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            userMarker.remove();
            userMarker = null;
        }
    } else {
        // Aloita käyttäjän sijainnin seuranta
        if ("geolocation" in navigator) {
            // Zoomaa käyttäjän nykyiseen sijaintiin ja lisää merkki kartalle
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const heading = position.coords.heading || 0; // Oletusarvo, jos suuntaa ei ole saatavilla

                // Lisää merkki kartalle tai päivitä olemassa olevaa
                updateUserMarker(lat, lon, heading);
                
                // Keskity käyttäjän sijaintiin ja zoomaa sisään
                map.setView([lat, lon], 16);

                // Aloita sijainnin jatkuva seuranta
                watchID = navigator.geolocation.watchPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const heading = position.coords.heading || 0; // Päivitä suuntaa tarvittaessa

                    updateUserMarker(lat, lon, heading);
                    // Keskity kartta automaattisesti käyttäjän liikkuessa
                    map.panTo([lat, lon]);

                }, function(error) {
                    console.error("Sijainnin seuranta epäonnistui: ", error);
                }, {
                    enableHighAccuracy: true,
                    maximumAge: 10000,
                    timeout: 5000
                });

                isTracking = true;
            }, function(error) {
                console.error("Sijainnin haku epäonnistui: ", error);
            }, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            });
        } else {
            alert("Selaimesi ei tue sijainnin hakua.");
        }
    }
}

// Kartan liikuttaminen lopettaa käyttäjän seurannan
map.on('dragstart', function() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            userMarker.remove();
            userMarker = null;
        }
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);
