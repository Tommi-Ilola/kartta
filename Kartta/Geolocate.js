let userMarker; // Käyttäjän sijaintia varten
let watchID;
let isTracking = false;

let userIcon = L.icon({
    iconUrl: 'circle-icon.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function updateUserLocation(lat, lon, accuracy) {
    console.log('Tarkkuus: ', accuracy); // Tämä tulostaa tarkkuuden konsoliin

    if (accuracy && !isNaN(accuracy) && accuracy > 0) {
        // Tarkkuus on kelvollinen, jatka ympyrän luomista tai päivitystä
        if (!userMarker) {
            userMarker = L.marker([lat, lon], {icon: userIcon}).addTo(map);
            userMarker.accuracyCircle = L.circle([lat, lon], {
                radius: accuracy,
                fillColor: '#0078ff99',
                fillOpacity: 0.4,
                color: '#0078ff99',
                weight: 1
            }).addTo(map);
        } else {
            userMarker.setLatLng([lat, lon]);
            userMarker.accuracyCircle.setLatLng([lat, lon]).setRadius(accuracy);
        }
    } else {
        console.error('Tarkkuus on NaN tai 0 tai negatiivinen.');
    }
}

function startTracking() {
    // Jos seuranta on jo päällä, lopeta se ja poista merkki
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) {
            map.removeLayer(userMarker);
            if (userMarker.accuracyCircle) {
                map.removeLayer(userMarker.accuracyCircle);
            }
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
            const accuracy = position.coords.accuracy;
            updateUserLocation(lat, lon, accuracy);
            if (isTracking) {
                map.setView([lat, lon], 16);
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

map.on('dragstart', function() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = true;
        document.querySelector('#locateUser img').src = "locate-unfollow.png";
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);
