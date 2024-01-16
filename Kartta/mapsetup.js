function verifyPassword() {
    var password = document.getElementById("passwordInput").value;
    if (password === "ratakilometri4") {
        document.getElementById("map").style.opacity = "1";
	map.invalidateSize();
	document.getElementById("protected-content").style.display = "block";
	document.getElementById("passwordModal").style.display = "none";
	// Pyydä Leafletiä päivittämään kartan koko
	setTimeout(function() {
	map.invalidateSize();
	}, 400);
	} else {
		alert("Väärä salasana!");
	}
}

// Näytä modaali, kun sivu latautuu
window.onload = function() {
    document.getElementById("passwordModal").style.display = "block";
}

// Sulje-napin toiminnallisuus
var span = document.getElementsByClassName("close")[0];
span.onclick = function() {

document.getElementById("passwordModal").style.display = "none";
}

document.getElementById("passwordInput").addEventListener("keypress", function(event) {
    // Tarkistetaan, onko painettu näppäin Enter (Enter-näppäimen keyCode on 13)
    if (event.keyCode === 13) {
        event.preventDefault(); // Estä oletustoiminta
        verifyPassword(); // Kutsu salasanan tarkistusfunktiota
    }
});

// Määritellään projektiotiedot
proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");

let defaultCoords, defaultZoom;

if (window.matchMedia("(max-width: 800px)").matches) {
    // Mobiiliasetukset
    defaultCoords = [67.532748, 25.579318];
    defaultZoom = 5;
} else {
    // Työpöytäasetukset
    defaultCoords = [66.415565, 26.484516];
    defaultZoom = 6;
}

let map = L.map('map').setView(defaultCoords, defaultZoom);

window.addEventListener("resize", function() {
    if (window.innerWidth <= 800) {
        map.setView(mobileCoords, mobileZoom);
    } else {
        map.setView(defaultCoords, defaultZoom);
    }
});

// Karttanäkymä (OSM)
var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 25,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Satelliittinäkymä (esim. Esri:n satelliittikuvat, jotka ovat ilmaisia ja julkisia)
var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 25,
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Painikkeen toiminnallisuus
document.getElementById('toggleView').addEventListener('click', function() {
    if (map.hasLayer(osmLayer)) {
        map.removeLayer(osmLayer);
        satelliteLayer.addTo(map);
    } else {
        map.removeLayer(satelliteLayer);
        osmLayer.addTo(map);
    }
});

