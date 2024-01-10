let userMarker; // Globaali muuttuja käyttäjän merkkiä varten
let userHeading; // Globaali muuttuja käyttäjän suunnalle

function updateMarker(lat, lon, heading) {
    // Päivitä käyttäjän sijaintia osoittavaa merkkiä
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: "#3186cc",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);
    }

    // Päivitä popup sisältämään ilmansuunta, jos se on saatavilla
    let popupContent = "Olet tässä: " + lat.toFixed(5) + ", " + lon.toFixed(5);
    if (heading !== undefined) {
        popupContent += "<br>Ilmansuunta: " + heading.toFixed(1) + "°";
        userHeading = heading;
    }
    userMarker.bindPopup(popupContent).openPopup();
}

function startTracking() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const heading = position.coords.heading; // Suunta, johon laite osoittaa, astetta (0 = pohjoinen)
            
            updateMarker(lat, lon, heading);
            
            // Zoomaa ja keskitä kartta uuteen sijaintiin
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
