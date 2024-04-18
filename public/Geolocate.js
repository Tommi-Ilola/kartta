L.control.locate({
    locateOptions: {
         maxZoom: 17, // Suurin zoomaustaso, kun sijainti löydetään
         watch: true,  // Jatkuva paikannus kunnes käyttäjä lopettaa sen
         setView: true // Automaattisesti keskitä näkymä löydettyyn sijaintiin
    }
}).addTo(map);
