;
(function () {

    'use strict';

    /*global google, CTC, MarkerClusterer */
    google.maps.Circle.prototype.contains = function (latLng) {
        return this.getBounds().contains(latLng) && google.maps.geometry.spherical.computeDistanceBetween(this.getCenter(), latLng) <= this.getRadius();
    };
    var map = new google.maps.Map(document.getElementById("map-canvas"), {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }),

        circle = {
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            radius: 1,
            map: map,
            center: map.getCenter()
        },
    // Add the circle for this city to the map.
        cityCircle = new google.maps.Circle(circle),
        clusterer,
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
                    cityCircle.setRadius(currentValue * 100);
                    $.each(markers, function (index) {
                        if (cityCircle.contains(markers[index].getPosition())) {
                            markers[index].setVisible(true);
                        } else {
                            markers[index].setVisible(false);
                        }
                    });
                    clusterer.repaint();
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
                visible: false,
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
         * @param markers_collection
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
            if (clusterer) {
                clusterer.clearMarkers();
            }

            slider.setBounds(minZoom, maxZoom);

            $.when(getDataDB(places)).then(function (data) {

                var bounds = new google.maps.LatLngBounds();

                cache_maps[places] = cache_maps[places] || data;

                clusterer = new MarkerClusterer(map, [], {
                    maxZoom: maxZoom,
                    ignoreHidden: true
                });

                $.each(data, function (index) {

                    bounds.extend(new google.maps.LatLng(this.latLon.lat, this.latLon.lon));
                    addMarker(map, this.latLon, this.address1);
                    clusterer.addMarker(markers[index], true);
                    google.maps.event.addListener(markers[index], 'visible_changed', function () {
                        if (markers[index].getVisible()) {
                            clusterer.addMarker(markers[index], true);
                        } else {
                            clusterer.removeMarker(markers[index], true);
                        }
                    });

                });

                map.setOptions({
                    minZoom: minZoom,
                    maxZoom: maxZoom
                });

                map.fitBounds(bounds);

                map.setZoom(currentZoom);
                $('.cs-slider_result').text(minZoom);
                cityCircle.setRadius(minZoom * 100);
                //slider.setPosition(currentZoom - minZoom);
            });
        };

    google.maps.event.addListener(map, 'click', function (e) {
        map.setCenter(e.latLng);
        cityCircle.setCenter(e.latLng);

        $.each(markers, function (index) {
            if (cityCircle.contains(markers[index].getPosition())) {
                markers[index].setVisible(true);
            } else {
                markers[index].setVisible(false);
            }
        });
        clusterer.repaint();
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
