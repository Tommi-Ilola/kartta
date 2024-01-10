let userMarker, userHeadingMarker;
let watchID;
let isTracking = false;

function updateUserMarker(lat, lon, heading) {
    if (!userMarker) {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#3186cc",
            color: "#3186cc",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
    } else {
        userMarker.setLatLng([lat, lon]);
    }

    // Päivitä suuntaa osoittavaa nuolta
    if (heading !== undefined && heading !== null) {
        if (!userHeadingMarker) {
            const icon = L.divIcon({
                className: 'heading-icon', // Määrittele tarvittavat tyylit .heading-icon-luokalle CSS:ssä
                html: '<div class="heading-icon" style="transform: rotate(' + heading + 'deg);">▲</div>', // Nuolen HTML
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            userHeadingMarker = L.marker([lat, lon], {icon: icon}).addTo(map);
        } else {
            userHeadingMarker.setLatLng([lat, lon]);
            userHeadingMarker.setIcon(L.divIcon({
                className: 'heading-icon',
                html: '<div class="heading-icon" style="transform: rotate(' + heading + 'deg);">▲</div>',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }));
        }
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
