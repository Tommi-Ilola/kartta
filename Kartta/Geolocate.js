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
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            userMarker.remove(); // Poista käyttäjän merkki kartalta
            userMarker = null;
        }
        if (userHeadingMarker) {
            userHeadingMarker.remove(); // Poista suuntaa osoittava nuoli
            userHeadingMarker = null;
        }
    } else {
        if ("geolocation" in navigator) {
            watchID = navigator.geolocation.watchPosition(function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const heading = position.coords.heading || 0; // Oletusarvo, jos suuntaa ei ole saatavilla

                updateUserMarker(lat, lon, heading);
                map.setView([lat, lon], map.getZoom());
            }, function(error) {
                console.error("Sijainnin seuranta epäonnistui: ", error);
            }, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            });

            isTracking = true;
        } else {
            alert("Selaimesi ei tue sijainnin hakua.");
        }
    }
}

map.on('dragstart', function() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            userMarker.remove();
            userMarker = null;
        }
        if (userHeadingMarker) {
            userHeadingMarker.remove();
            userHeadingMarker = null;
        }
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);
