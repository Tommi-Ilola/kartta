L.control.locate({
    locateOptions: {
         maxZoom: 17, // Suurin zoomaustaso, kun sijainti löydetään
         watch: true,  // Jatkuva paikannus kunnes käyttäjä lopettaa sen
         setView: true // Automaattisesti keskitä näkymä löydettyyn sijaintiin
    }
}).addTo(map);

document.querySelector('.leaflet-control-locate a').addEventListener('touchend', function(e) {
    e.preventDefault(); // Estä oletustoiminto, kuten näytön vieritys tai zoomaus
    this.click(); // Pakota click-tapahtuman laukaisu
}, false);
