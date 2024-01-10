(function() {
    // save these original methods before they are overwritten
    var proto_initIcon = L.Marker.prototype._initIcon;
    var proto_setPos = L.Marker.prototype._setPos;

    var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        var iconOptions = this.options.icon && this.options.icon.options;
        var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        if (iconAnchor) {
            iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
        }
        this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom' ;
        this.options.rotationAngle = this.options.rotationAngle || 0;

        // Ensure marker keeps rotated during dragging
        this.on('drag', function(e) { e.target._applyRotation(); });
    });

    L.Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if(this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

                if(oldIE) {
                    // for IE 9, use the 2D rotation
                    this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    // for modern browsers, prefer the 3D accelerated version
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();

// Varmista, että L.RotatedMarker on ladattu ja käytettävissä
if (!L.RotatedMarker) {
    console.error("L.RotatedMarker-kirjastoa ei löydy. Varmista, että olet lisännyt sen.");
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
        headingMarker = new L.RotatedMarker([lat, lon], {
            icon: headingIcon,
            rotationAngle: heading // Asetetaan alkuperäinen kulma
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
