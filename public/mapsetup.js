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
proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs");
proj4.defs("EPSG:4326","+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");

var currentBaseLayer = "gm";
        var map = L.map("map").setView([67.500, 26.000], 5);

        var gm = L.gridLayer.googleMutant({
            maxZoom: 24,
            type: "roadmap"
        }).addTo(map);

        var hybrid = L.gridLayer.googleMutant({
            maxZoom: 24,
            type: "hybrid"
        });

		document.getElementById('toggleView').addEventListener('click', function () {
				if (map.hasLayer(gm)) {
					map.removeLayer(gm);
					hybrid.addTo(map);
				} else {
					map.removeLayer(hybrid);
					gm.addTo(map);
				}
			updateMarkerStyles();
			updateTooltipStyles();
		});


document.getElementById('infoButton').addEventListener('click', function() {
    var infoContent = document.getElementById('infoContent');
	var infoButton = document.getElementById('infoButton');
        infoContent.style.display = 'block';
		infoButton.style.display = 'none';
});

document.getElementById('closeInfo').addEventListener('click', function() {
    var infoContent = document.getElementById('infoContent');
	var infoButton = document.getElementById('infoButton');
        infoContent.style.display = 'none';
		infoButton.style.display = 'block';
});
