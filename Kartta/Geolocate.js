let userMarker; // Käyttäjän sijaintia varten
let headingMarker; // Suuntaa osoittavaa nuolta varten

function updateUserLocation(lat, lon) {
    if (!userMarker) {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#3186cc",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
    } else {
        userMarker.setLatLng([lat, lon]);
    }
}

function updateHeading(lat, lon, heading) {
    if (!headingMarker) {
        headingMarker = L.marker([lat, lon], {
            icon: headingIcon
        }).addTo(map);
    } else {
        headingMarker.setLatLng([lat, lon]);
    }

    // Päivitä käyttäjän sijaintia osoittavan merkin tooltip
    let popupContent = "Olet tässä: " + lat.toFixed(5) + ", " + lon.toFixed(5);
    if (heading !== undefined) {
        popupContent += "<br>Ilmansuunta: " + heading.toFixed(1) + "°";
    }
    userMarker.bindPopup(popupContent).openPopup();
}

function startTracking() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const heading = position.coords.heading;

            updateUserLocation(lat, lon);
            updateHeading(lat, lon, heading);
            map.setView([lat, lon], map.getZoom());
        }, function(error) {
            console.error("Sijainnin seuranta epäonnistui: ", error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
        });
    } else {
        alert("Selaimesi ei tue sijainnin hakua.");
    }
}

document.getElementById('locateUser').addEventListener('click', startTracking);

