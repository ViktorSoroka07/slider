;(function () {

    'use strict';

    /*global google, CTC */

    var map = new google.maps.Map(document.getElementById("map_canvas"), {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }),
        lowBound = null,
        $progress = $('.cs-slider_result'),
        slider = new CTC.modules.CustomSlider('#cs-slider', {
            animationCallback: function (currentValue, low_bound) {
                lowBound = low_bound;
                $progress.text(currentValue);
                map.setZoom(currentValue);
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

        initMap = function (minZoom, maxZoom, currentZoom) {

            slider.setBounds(minZoom, maxZoom);

            $.when(getDataDB()).then(function (data) {
                var bounds = new google.maps.LatLngBounds();

                $.each(data, function () {
                    bounds.extend(new google.maps.LatLng(this.latLon.lat, this.latLon.lon));
                    addMarker(map, this.latLon, this.address1);
                });

                map.fitBounds(bounds);

                map.setOptions({
                    minZoom: minZoom,
                    maxZoom: maxZoom
                });
                slider.setPosition(currentZoom - minZoom);
            });
        };

    google.maps.event.addListener(map, 'zoom_changed', function () {
        slider.setPosition(+map.getZoom() - map.minZoom);
    });

    initMap(5, 20, 15);
}());
