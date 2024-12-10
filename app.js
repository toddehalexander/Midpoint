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
    let isLocationPicked = false; // Flag to stop API calls if a location is selected

    input.addEventListener('input', async function () {
        if (isLocationPicked) return; // Prevent API requests if a location is picked

        list.innerHTML = ''; // Clear previous results

        if (this.value.length < 3) return; // Only trigger API for 3 or more characters

        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    format: 'json',
                    q: this.value,
                    countrycodes: 'us', // Restrict results to USA
                },
            });
            const data = response.data;

            // Populate dropdown with suggestions
            data.forEach(item => {
                const option = document.createElement('div');
                option.textContent = item.display_name;
                option.addEventListener('click', () => {
                    input.value = item.display_name; // Set input value
                    list.innerHTML = ''; // Clear dropdown
                    isLocationPicked = true; // Disable further requests
                    input.blur(); // Deselect input
                });
                list.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    });

    // Reset flag when input field is modified
    input.addEventListener('focus', function () {
        if (input.value.trim() === '') {
            isLocationPicked = false; // Enable API calls if input is cleared
        }
    });

    input.addEventListener('input', function () {
        if (this.value.trim() === '') {
            isLocationPicked = false; // Reset flag if the input is cleared
        }
    });

    // Clear dropdown when focus is lost
    input.addEventListener('blur', function () {
        setTimeout(() => {
            list.innerHTML = ''; // Delay to handle click events
        }, 200);
    });

    // Prevent Enter key from reopening dropdown
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            list.innerHTML = ''; // Clear dropdown
            isLocationPicked = true; // Disable API requests
            input.blur(); // Deselect input
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

document.getElementById('locationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const loc1 = document.getElementById('location1').value;
    const loc2 = document.getElementById('location2').value;
    const radiusMiles = document.getElementById('radius').value;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
        // Get coordinates for both locations
        const coords1 = await getCoordinates(loc1);
        const coords2 = await getCoordinates(loc2);

        // Calculate midpoint
        midpoint = [
            (coords1[0] + coords2[0]) / 2,
            (coords1[1] + coords2[1]) / 2,
        ];

        // Add markers and circle
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });

        L.marker(coords1).addTo(map).bindPopup(`Location 1: ${loc1}`);
        L.marker(coords2).addTo(map).bindPopup(`Location 2: ${loc2}`);
        L.marker(midpoint).addTo(map).bindPopup('Midpoint');
        L.circle(midpoint, {
            color: '#7eb1a2',
            fillColor: '#97c4b8',
            fillOpacity: 0.5,
            radius: radiusMeters,
        }).addTo(map);

        map.setView(midpoint, 13);

        // Fetch and display amenities
        const amenities = await getAmenities(midpoint[0], midpoint[1], radiusMeters);
        lastFetchedAmenities = amenities;

        // Extract unique categories and generate buttons
        const categories = [...new Set(amenities.map((amenity) => amenity.tags.amenity))];
        generateCategoryButtons(categories);

        // Display amenities
        displayAmenities(amenities);

        // Show the "Select All" and "Disable All" buttons
        document.getElementById('category-controls').style.display = 'block';

    } catch (error) {
        alert('Error fetching amenities: ' + error.message);

        // Hide the "Select All" and "Disable All" buttons if there's an error
        document.getElementById('category-controls').style.display = 'none';
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

let lastFetchedAmenities = []; // Store fetched amenities globally
let activeCategories = new Set(); // Track active categories
let midpoint = null; // Define midpoint globally

// Dynamically generate category buttons
function generateCategoryButtons(categories) {
    const categoryContainer = document.getElementById('category-checkboxes');
    categoryContainer.innerHTML = ''; // Clear any existing buttons

    if (categories.length === 0) {
        const noCategoryMessage = document.createElement('p');
        noCategoryMessage.textContent = "No categories available.";
        categoryContainer.appendChild(noCategoryMessage);
        return;
    }

    categories.forEach((category) => {
        const button = document.createElement('button');
        button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        button.className = 'category-button active'; // Active by default
        button.dataset.category = category;

        // Add click event to toggle category
        button.addEventListener('click', function () {
            if (activeCategories.has(category)) {
                activeCategories.delete(category);
                button.classList.remove('active');
            } else {
                activeCategories.add(category);
                button.classList.add('active');
            }
            filterAmenities(); // Refresh amenities display
        });

        categoryContainer.appendChild(button);
        activeCategories.add(category); // Add to activeCategories initially
    });
}

// Filter amenities based on active categories
function filterAmenities() {
    const filteredAmenities = lastFetchedAmenities.filter((amenity) =>
        activeCategories.has(amenity.tags.amenity)
    );
    displayAmenities(filteredAmenities);
}

// Display amenities on the map and in the list
function displayAmenities(amenities) {
    const amenitiesList = document.getElementById('amenities-list');
    amenitiesList.innerHTML = ''; // Clear previous list

    map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !layer.options.permanent) {
            map.removeLayer(layer);
        }
    });

    const categorizedAmenities = {};

    amenities.forEach((amenity) => {
        const coords = [amenity.lat, amenity.lon];
        const name = amenity.tags.name || 'Unknown';
        const type = amenity.tags.amenity;

        const distance = calculateDistance(midpoint[0], midpoint[1], coords[0], coords[1]).toFixed(2);

        // Add marker
        const marker = L.marker(coords).addTo(map);
        marker.bindPopup(`${name} (${type}, ${distance} miles)`);

        // Categorize amenities
        if (!categorizedAmenities[type]) {
            categorizedAmenities[type] = [];
        }
        categorizedAmenities[type].push(`${name} (${distance} miles)`);
    });

    // Display categorized amenities with labels
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
}

// Form submission handler
document.getElementById('locationForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const loc1 = document.getElementById('location1').value;
    const loc2 = document.getElementById('location2').value;
    const radiusMiles = document.getElementById('radius').value;
    const radiusMeters = milesToMeters(radiusMiles);

    try {
        // Get coordinates for both locations
        const coords1 = await getCoordinates(loc1);
        const coords2 = await getCoordinates(loc2);

        // Calculate midpoint
        midpoint = [
            (coords1[0] + coords2[0]) / 2,
            (coords1[1] + coords2[1]) / 2,
        ];

        // Add markers and circle
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Circle) {
                map.removeLayer(layer);
            }
        });

        L.marker(coords1).addTo(map).bindPopup(`Location 1: ${loc1}`);
        L.marker(coords2).addTo(map).bindPopup(`Location 2: ${loc2}`);
        L.marker(midpoint).addTo(map).bindPopup('Midpoint');
        L.circle(midpoint, {
            color: '#7eb1a2',
            fillColor: '#97c4b8',
            fillOpacity: 0.5,
            radius: radiusMeters,
        }).addTo(map);

        map.setView(midpoint, 13);

        // Fetch and display amenities
        const amenities = await getAmenities(midpoint[0], midpoint[1], radiusMeters);
        lastFetchedAmenities = amenities;

        // Extract unique categories and generate buttons
        const categories = [...new Set(amenities.map((amenity) => amenity.tags.amenity))];
        generateCategoryButtons(categories);

        // Display amenities
        displayAmenities(amenities);
    } catch (error) {
        alert('Error fetching amenities: ' + error.message);
    }
});
// Function to select all categories
function selectAllCategories() {
    const buttons = document.querySelectorAll('.category-button');
    buttons.forEach((button) => {
        const category = button.dataset.category;
        if (!activeCategories.has(category)) {
            activeCategories.add(category);
            button.classList.add('active');
        }
    });
    filterAmenities(); // Refresh amenities display
}

// Function to disable all categories
function disableAllCategories() {
    const buttons = document.querySelectorAll('.category-button');
    buttons.forEach((button) => {
        const category = button.dataset.category;
        if (activeCategories.has(category)) {
            activeCategories.delete(category);
            button.classList.remove('active');
        }
    });
    filterAmenities(); // Refresh amenities display
}

// Add event listeners for "Select All" and "Disable All" buttons
document.getElementById('select-all-categories').addEventListener('click', selectAllCategories);
document.getElementById('disable-all-categories').addEventListener('click', disableAllCategories);
