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

const gmLightUrl = 'https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}';
const gmDarkUrl = 'https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}&style=feature:all|element:all|invert_lightness:true';
const satelliteUrl = 'https://www.google.cn/maps/vt?lyrs=y@189&gl=cn&x={x}&y={y}&z={z}';

// Oletetaan, että gmLayer on alustettu tummalle teemalle jos laite on tummassa tilassa
let gmLayer = L.tileLayer(window.matchMedia('(prefers-color-scheme: dark)').matches ? gmDarkUrl : gmLightUrl, {
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'GoogleMaps'
}).addTo(map);

// Satelliittinäkymä ei muutu tumman tilan mukaan
let satelliteLayer = L.tileLayer(satelliteUrl, {
    maxZoom: 22,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'GoogleMaps'
});

// Tarkkaile tumman tilan muutoksia ja päivitä karttatason URL tarvittaessa
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    const newUrl = e.matches ? gmDarkUrl : gmLightUrl;
    gmLayer.setUrl(newUrl);
});

// Tässä oleva toggleView-tapahtumankuuntelija pysyy samana
document.getElementById('toggleView').addEventListener('click', function() {
    if (map.hasLayer(gmLayer)) {
        map.removeLayer(gmLayer);
        satelliteLayer.addTo(map);
        currentBaseLayer = "satellite";
    } else {
        map.removeLayer(satelliteLayer);
        gmLayer.addTo(map);
        currentBaseLayer = "gm";
    }
    updateMarkerStyles();
	updateTooltipStyles();
});
