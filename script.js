function findMiddlePoint() {
    var location1 = document.getElementById('location1').value;
    var location2 = document.getElementById('location2').value;

    var geocoder = new google.maps.Geocoder();
    var map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 1
    });

    // Geocode the first location
    geocoder.geocode({ 'address': location1 }, function (results1, status1) {
        if (status1 === 'OK') {
            var lat1 = results1[0].geometry.location.lat();
            var lng1 = results1[0].geometry.location.lng();

            // Geocode the second location
            geocoder.geocode({ 'address': location2 }, function (results2, status2) {
                if (status2 === 'OK') {
                    var lat2 = results2[0].geometry.location.lat();
                    var lng2 = results2[0].geometry.location.lng();

                    var midLat = (lat1 + lat2) / 2;
                    var midLng = (lng1 + lng2) / 2;

                    var midpoint = { lat: midLat, lng: midLng };

                    // Create a marker for the first location
                    var marker1 = new google.maps.Marker({
                        position: results1[0].geometry.location,
                        map: map,
                        title: 'Location 1'
                    });

                    // Create a marker for the second location
                    var marker2 = new google.maps.Marker({
                        position: results2[0].geometry.location,
                        map: map,
                        title: 'Location 2'
                    });

                    // Draw a line from location 1 to the midpoint
                    var linePath1 = [results1[0].geometry.location, midpoint];
                    var line1 = new google.maps.Polyline({
                        path: linePath1,
                        geodesic: true,
                        strokeColor: '#0000FF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2
                    });
                    line1.setMap(map);

                    // Draw a line from location 2 to the midpoint
                    var linePath2 = [results2[0].geometry.location, midpoint];
                    var line2 = new google.maps.Polyline({
                        path: linePath2,
                        geodesic: true,
                        strokeColor: '#00FF00',
                        strokeOpacity: 0.8,
                        strokeWeight: 2
                    });
                    line2.setMap(map);

                    map.setCenter(midpoint);
                    map.setZoom(10); // Set the zoom level to 10

                    var markerMidpoint = new google.maps.Marker({
                        position: midpoint,
                        map: map,
                        title: 'Midpoint'
                    });

                    // Add a circle around the midpoint
                    var circle = new google.maps.Circle({
                        center: midpoint,
                        radius: 16093.4, // 10 miles in meters
                        fillColor: '#FF0000',
                        fillOpacity: 0.2,
                        strokeColor: '#FF0000',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        map: map
                    });

                    // Update the midpoint coordinates
                    document.getElementById('midpointCoordinates').innerText = "Midpoint Coordinates: " + midLat + ", " + midLng;

                    // Find accommodations near the midpoint
                    var request = {
                        location: midpoint,
                        radius: '16093.4', // 10 miles in meters
                        type: ['restaurant', 'cafe', 'food'] // search for food-related places
                    };

                    var service = new google.maps.places.PlacesService(map);
                    service.nearbySearch(request, function (results, status) {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            var accommodationsList = document.createElement('ul');
                            results.forEach(function (place) {
                                var listItem = document.createElement('li');
                                listItem.textContent = place.name;
                                accommodationsList.appendChild(listItem);
                            });
                            document.getElementById('accommodationsNearby').innerHTML = "<h3>Accommodations Near Midpoint (10 mile radius):</h3>";
                            document.getElementById('accommodationsNearby').appendChild(accommodationsList);
                        } else {
                            console.error('Error fetching nearby accommodations:', status);
                        }
                    });
                } else {
                    alert('Geocode was not successful for the following reason: ' + status2);
                }
            });
        } else {
            alert('Geocode was not successful for the following reason: ' + status1);
        }
    });
}
