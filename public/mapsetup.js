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

proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");
proj4.defs("EPSG:4326","+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");

let currentBaseLayer = "gm"
var isRetina = L.Browser.retina;

// Karttanäkymä (OSM)
let map = L.map('map', {
    minZoom: 0,
    maxZoom: 22
});

let gmLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
        maxZoom: 22,
        subdomains:['mt0','mt1','mt2','mt3'],
		attribution: 'GoogleMaps'
}).addTo(map);

map.setView([67.500, 26.000], 5);

// Satelliittinäkymä (Esri)
let satelliteLayer = L.tileLayer('https://www.google.cn/maps/vt?lyrs=y@189&gl=cn&x={x}&y={y}&z={z}',{
        maxZoom: 22,
        subdomains:['mt0','mt1','mt2','mt3'],
		attribution: 'GoogleMaps'
});

document.getElementById('toggleView').addEventListener('click', function() {
    if (map.hasLayer(gmLayer)) {
        map.removeLayer(gmLayer);
        satelliteLayer.addTo(map);
        currentBaseLayer = "satellite"; // Päivitä nykyinen karttataso satelliitiksi
    } else {
        map.removeLayer(satelliteLayer);
        gmLayer.addTo(map);
        currentBaseLayer = "gm"; // Päivitä nykyinen karttataso OSM:ksi
    }
    updateMarkerStyles();
	updateTooltipStyles();
});
