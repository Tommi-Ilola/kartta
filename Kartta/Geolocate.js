// Varmista, että L.marker on ladattu ja käytettävissä
if (!L.marker) {
    console.error("L.marker-kirjastoa ei löydy. Varmista, että olet lisännyt sen.");
}

let userMarker; // Käyttäjän sijaintia varten
let headingMarker; // Suuntaa osoittavaa nuolta varten
let watchID;
let isTracking = false;

// Määritellään kaksi eri ikonia: yksi käyttäjän sijainnille, toinen suunnalle
let userIcon = L.icon({
    iconUrl: 'circle-icon.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

let headingIcon = L.icon({
    iconUrl: 'arrow-icon.png',
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

function updateHeading(lat, lon, heading) {
    if (!headingMarker) {
        headingMarker = L.marker([lat, lon], {
            icon: headingIcon,
            rotationAngle: heading
        }).addTo(map);
    } else {
        headingMarker.setLatLng([lat, lon]);
        headingMarker.setRotationAngle(heading);
    }
}

function startTracking() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) userMarker.remove();
        userMarker = null;
        if (headingMarker) headingMarker.remove();
        headingMarker = null;

        document.querySelector('#locateUser img').src = "locate.png";
    } else {
        if ("geolocation" in navigator) {
            isTracking = true;
            document.querySelector('#locateUser img').src = "locate-active.png";
            watchID = navigator.geolocation.watchPosition(function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const heading = position.coords.heading || 0;

                updateUserLocation(lat, lon);
                updateHeading(lat, lon, heading);

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
}

map.on('dragstart', function() {
    if (isTracking) {
        navigator.geolocation.clearWatch(watchID);
        isTracking = false;
        if (userMarker) userMarker.remove();
        userMarker = null;
        if (headingMarker) headingMarker.remove();
        headingMarker = null;

        document.querySelector('#locateUser img').src = "locate.png";
    }
});

document.getElementById('locateUser').addEventListener('click', startTracking);

