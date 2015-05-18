;
(function () {

    'use strict';

    var map = new google.maps.Map(document.getElementById("map_canvas"), {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }),
        slider = new CTC.modules.CustomSlider('#cs-slider', {
            animationCallback: function (x) {
                $('.cs-slider_result').text(x);
                map.setZoom(+x);
            }
        }),

        getDataDB = function () {
            return $.getJSON('./DB/places.json');
        },

        addMarker = function (map, coords, title) {
            new google.maps.Marker({
                position: new google.maps.LatLng(coords.lat, coords.lon),
                title: title,
                map: map,
                animation: google.maps.Animation.DROP
            });
        },

        initMap = function () {
            $.when(getDataDB()).then(function (data) {
                var bounds = new google.maps.LatLngBounds();

                $.each(data, function () {
                    bounds.extend(new google.maps.LatLng(this.latLon.lat, this.latLon.lon));
                    addMarker(map, this.latLon, this.address1);
                });

                map.fitBounds(bounds);
                slider.setPosition(15);
            });
        };

    google.maps.event.addListener(map, 'zoom_changed', function () {
        slider.setPosition(+map.getZoom());
    });

    initMap();
}());
