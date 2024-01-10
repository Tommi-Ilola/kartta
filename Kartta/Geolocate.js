let userMarker; // Käyttäjän sijaintia varten
let watchID;
let isTracking = false;

let userIcon = L.icon({
    iconUrl: 'circle-icon.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function updateUserLocation(lat, lon) {
    if (!userMarker) {
        userMarker = L.marker([lat, lon], {icon: userIcon}).addTo(map);
    } else {
        userMarker.setLatLng([lat, lon]);
    }
}

function startTracking() {
    // Jos seuranta on jo päällä, lopeta se ja poista merkki
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            map.removeLayer(userMarker);
            userMarker = null;
        }
        document.querySelector('#locateUser img').src = "locate.png";
        return; // Keskeytä funktion suoritus
    }

    // Aloita käyttäjän sijainnin seuraaminen
    if ("geolocation" in navigator) {
        isTracking = true;
        document.querySelector('#locateUser img').src = "locate-active.png";
        watchID = navigator.geolocation.watchPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            updateUserLocation(lat, lon);
            map.setView([lat, lon], 16);
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

map.on('dragstart', function() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        document.querySelector('#locateUser img').src = "locate-unfollow.png";
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);
