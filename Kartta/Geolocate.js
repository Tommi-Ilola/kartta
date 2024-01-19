let userMarker; // Käyttäjän sijaintia varten
let isTracking = false;

let userIcon = L.icon({
    iconUrl: 'circle-icon.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

map.on('locationfound', function(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const radius = e.accuracy / 2; // Leaflet palauttaa tarkkuuden halkaisijana

    if (!userMarker) {
        userMarker = L.marker([lat, lon], {icon: userIcon}).addTo(map);
        userMarker.accuracyCircle = L.circle([lat, lon], radius).addTo(map);
    } else {
        userMarker.setLatLng([lat, lon]);
        userMarker.accuracyCircle.setLatLng([lat, lon]).setRadius(radius);
    }
});

map.on('locationerror', function(e) {
    alert(e.message);
});

map.on('dragstart', function() {
    if (isTracking) {
        map.stopLocate();
        isTracking = false;
        document.querySelector('#locateUser img').src = "locate-unfollow.png";
    }
});

function startTracking() {
    if (isTracking) {
        map.stopLocate();
        isTracking = false;
        document.querySelector('#locateUser img').src = "locate.png";
        if (userMarker) {
            map.removeLayer(userMarker);
            map.removeLayer(userMarker.accuracyCircle);
            userMarker = null;
        }
    } else {
        map.locate({setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true});
        isTracking = true;
        document.querySelector('#locateUser img').src = "locate-active.png";
    }
}

document.getElementById('locateUser').addEventListener('click', startTracking);

