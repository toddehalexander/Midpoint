// Initialize the map
var map = L.map('map').setView([0, 0], 2);
var circle;

// Add the base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Update radius value display in miles
document.getElementById('radius').addEventListener('input', function() {
    document.getElementById('radius-value').textContent = this.value;
});

// Update radius value display in miles
document.getElementById('radius').addEventListener('input', function() {
    const radiusMiles = this.value;
    document.getElementById('radius-value').textContent = radiusMiles;
});

// Function to convert miles to meters
function milesToMeters(miles) {
    return miles * 1609.34; // Convert miles to meters
}

// Function to calculate distance in miles between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

async function autocompleteLocation(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    let isLocationPicked = false; // Track if the user has picked a location

    input.addEventListener('input', async function () {
        if (isLocationPicked) return; // Stop API calls if a location has been picked

        list.innerHTML = ''; // Clear previous results

        if (this.value.length < 3) return; // Only trigger search for 3 or more characters

        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    format: 'json',
                    q: this.value,
                    countrycodes: 'us', // Restrict results to USA
                },
            });
            const data = response.data;

            data.forEach(item => {
                const option = document.createElement('div');
                option.textContent = item.display_name;
                option.addEventListener('click', () => {
                    input.value = item.display_name; // Set the input value
                    list.innerHTML = ''; // Clear the dropdown after selection
                    isLocationPicked = true; // Mark location as picked
                });
                list.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    });

    input.addEventListener('focus', function () {
        if (input.value.length === 0) {
            isLocationPicked = false; // Reset the flag if the input is cleared
        }
    });

    input.addEventListener('input', function () {
        if (this.value.length === 0) {
            isLocationPicked = false; // Reset the flag when the user clears the input
        }
    });

    input.addEventListener('blur', function () {
        setTimeout(() => {
            list.innerHTML = ''; // Clear dropdown when the input loses focus
        }, 200);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            list.innerHTML = ''; // Clear the dropdown on pressing Enter
            isLocationPicked = true; // Mark location as picked
        }
    });
}





// Activate autocomplete on both inputs
autocompleteLocation('location1', 'autocomplete-list1');
autocompleteLocation('location2', 'autocomplete-list2');

// Function to get coordinates from an address
async function getCoordinates(location) {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);
    const data = response.data;
    if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } else {
        throw new Error('Location not found');
    }
}

// Function to get amenities near a point
async function getAmenities(lat, lon, radius) {
    const overpassQuery = `[out:json];
    (
        node["amenity"](around:${radius}, ${lat}, ${lon});
    );
    out body;`;

    const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data.elements;
}

// Form submission handler
document.getElementById('locationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const loc1 = document.getElementById('location1').value;
    const loc2 = document.getElementById('location2').value;
    const radiusMiles = document.getElementById('radius').value;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
        // Get the coordinates for both locations
        const coords1 = await getCoordinates(loc1);
        const coords2 = await getCoordinates(loc2);

        // Calculate the midpoint
        const midpoint = [
            (coords1[0] + coords2[0]) / 2,
            (coords1[1] + coords2[1]) / 2
        ];

        // Clear existing markers and circle
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });

        // Add markers for both locations and the midpoint
        L.marker(coords1).addTo(map).bindPopup(`Location 1: ${loc1}`).openPopup();
        L.marker(coords2).addTo(map).bindPopup(`Location 2: ${loc2}`).openPopup();
        L.marker(midpoint).addTo(map).bindPopup('Midpoint').openPopup();

        // Draw a circle around the midpoint
        circle = L.circle(midpoint, {
            color: '#7eb1a2',
            fillColor: '#97c4b8',
            fillOpacity: 0.5,
            radius: radiusMeters
        }).addTo(map);

        // Pan the map to the midpoint
        map.setView(midpoint, 13);

        // Fetch nearby amenities
        const amenities = await getAmenities(midpoint[0], midpoint[1], radiusMeters);

        // Clear the previous list of amenities
        const amenitiesList = document.getElementById('amenities-list');
        amenitiesList.innerHTML = '';

        const categorizedAmenities = {};

        // Add markers for amenities and list them
        amenities.forEach((amenity) => {
            const coords = [amenity.lat, amenity.lon];
            const name = amenity.tags.name || 'Unknown';
            const type = amenity.tags.amenity;

            // Calculate distance from the midpoint in miles
            const distance = calculateDistance(midpoint[0], midpoint[1], coords[0], coords[1]).toFixed(2);

            // Add marker to the map
            L.marker(coords).addTo(map).bindPopup(`${name} (${type}, ${distance} miles)`).openPopup();

            // Categorize the amenities
            if (!categorizedAmenities[type]) {
                categorizedAmenities[type] = [];
            }
            categorizedAmenities[type].push(`${name} (${distance} miles)`);
        });

        // Display the categorized list of amenities
        Object.keys(categorizedAmenities).forEach((category) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'amenity-item';
            const title = document.createElement('h4');
            title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryElement.appendChild(title);

            categorizedAmenities[category].forEach((name) => {
                const item = document.createElement('p');
                item.textContent = name;
                categoryElement.appendChild(item);
            });

            amenitiesList.appendChild(categoryElement);
        });

    } catch (error) {
        alert('Error finding locations or amenities: ' + error.message);
    }
});
// Hide the autocomplete list when clicking outside
document.addEventListener('click', function(e) {
    const input1 = document.getElementById('location1');
    const input2 = document.getElementById('location2');
    const list1 = document.getElementById('autocomplete-list1');
    const list2 = document.getElementById('autocomplete-list2');

    if (e.target !== input1) {
        list1.innerHTML = ''; // Clear the dropdown for location 1
    }

    if (e.target !== input2) {
        list2.innerHTML = ''; // Clear the dropdown for location 2
    }
});