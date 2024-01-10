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
        // Päivitä nuolen suuntaa vain, jos heading on saatavilla
        if (heading !== null && heading !== undefined && userMarker._icon) {
            userMarker._icon.style.transform += ' rotate(' + heading + 'deg)';
        }
    } else {
        userMarker = L.marker([lat, lon], {icon: userIcon}).addTo(map);
    }
}

function startTracking() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) userMarker.remove();
        userMarker = null;

        // Muuta painikkeen kuvaa
        document.querySelector('#locateUser img').src = "locate.png";
    } else {
        if ("geolocation" in navigator) {
            isTracking = true;
            document.querySelector('#locateUser img').src = "locate-active.png";
            watchID = navigator.geolocation.watchPosition(function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const heading = position.coords.heading || 0;
                
                updateUserMarker(lat, lon, heading);
                if (isTracking) {
                    // Keskity ja zoomaa käyttäjän sijaintiin
                    map.setView([lat, lon], 16); // Voit säätää zoom-tasoa
                }
            }, function(error) {
                console.error("Sijainnin seuranta epäonnistui: ", error);
                isTracking = false;
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
        if (userMarker) userMarker.remove();
        userMarker = null;
        // Muuta painikkeen tekstiä tai ulkoasua tarvittaessa
        document.getElementById('locateUser').textContent = "Locate Me";
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);
