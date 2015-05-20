;(function () {

    'use strict';

    /*global google, CTC, MarkerClusterer */

    var map = new google.maps.Map(document.getElementById("map-canvas"), {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }),
        cluster,
        prev_info_window = false,
        image_marker = './img/map-icon.png',
        $progress = $('.cs-slider_result'),
        $buttons = $('.map-btn'),
        cache_maps = {},
        markers = [],
        prev_value = null,

        slider = new CTC.modules.CustomSlider('#cs-slider', {
            animationCallback: function (currentValue) {
                $progress.text(currentValue);
                if (prev_value !== currentValue) {
                    prev_value = currentValue;
                    map.setZoom(currentValue);
                }
            }
        }),

        /**
         * it get places data from the server or cache object
         * @param data_name - a name of file to get from the data storage
         */
        getDataDB = function (data_name) {
            if (data_name in cache_maps) {
                return cache_maps[data_name];
            }
            return $.getJSON('./DB/' + data_name + '.json');
        },

        /**
         * it adds marker to the map
         * @param map - a map to add marker in
         * @param coords - the coordinates of marker
         * @param title - a title on hover on marker
         */
        addMarker = function (map, coords, title) {

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(coords.lat, coords.lon),
                title: title,
                map: map,
                info: new google.maps.InfoWindow({
                    content: '<div class="marker-content">' + title + '</p>'
                }),
                icon: image_marker
            });

            google.maps.event.addListener(marker, 'click', function () {
                if (prev_info_window) {
                    prev_info_window.close();
                }
                prev_info_window = marker.info;
                map.panTo(marker.getPosition());
                marker.info.open(map, marker);
            });

            markers.push(marker);

        },

        /**
         * it remove one marker from the map that passed in as a parameter
         * @param marker - marker to delete
         */
        removeMarker = function (marker) {
            marker.setMap(null);
        },

        /**
         * it removes all markers from the map
         * @param markers {Array} - a collection of markers
         */
        removeMarkers = function (markers_collection) {
            $.each(markers_collection, function () {
                removeMarker(this);
            });
            markers = [];
        },

        /**
         * it renders map according to the params that were passed in
         * @param minZoom {Number} - min zoom for a map
         * @param maxZoom {Number} - a max zoom for a map
         * @param currentZoom {Number} - a current zoom for a map
         * @param places {Array} - a collection of places to render on map
         */
        renderMap = function (minZoom, maxZoom, currentZoom, places) {

            google.maps.event.addListenerOnce(map, 'bounds_changed', function () {
                this.setZoom(currentZoom);
            });


            removeMarkers(markers);
            if (cluster) {
                cluster.clearMarkers();
            }

            slider.setBounds(minZoom, maxZoom);

            $.when(getDataDB(places)).then(function (data) {

                var bounds = new google.maps.LatLngBounds();

                cache_maps[places] = cache_maps[places] || data;

                $.each(data, function () {

                    bounds.extend(new google.maps.LatLng(this.latLon.lat, this.latLon.lon));
                    addMarker(map, this.latLon, this.address1);

                });

                cluster = new MarkerClusterer(map, markers, {
                    maxZoom: maxZoom,
                    ignoreHidden: true
                });

                map.setOptions({
                    minZoom: minZoom,
                    maxZoom: maxZoom
                });

                map.fitBounds(bounds);

                map.setZoom(currentZoom);

                slider.setPosition(currentZoom - minZoom);
            });
        };

    google.maps.event.addListener(map, 'zoom_changed', function () {

        slider.setPosition(map.getZoom() - map.minZoom);

    });

    google.maps.event.addDomListener(window, "resize", function () {

        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);

    });

    $buttons.on('click touchstart', function () {

        var data = $(this).attr('data-places');
        renderMap(5, 21, 14, data);
        $(this).siblings().removeClass('active');
        $(this).addClass('active');

    });

    $buttons.first().trigger('click');

}());
