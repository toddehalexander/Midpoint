# Location Midpoint Finder with Nearby Amenities

## Overview
This project is a web application that allows users to find the midpoint between two geographical locations and display nearby amenities within a specified radius. The application uses the OpenStreetMap (OSM) API, Overpass API, and Leaflet for map interactions.

## Features
- **Search for locations**: Users can search for two locations using an autocomplete feature powered by Nominatim (OpenStreetMap's search engine).
- **Calculate midpoint**: The midpoint between two locations is automatically calculated and displayed on the map.
- **Display nearby amenities**: Amenities within a certain radius of the midpoint are fetched and displayed on the map.
- **Dynamic radius**: The user can specify the search radius in miles, which updates in real time.
- **Customizable theme**: Users can switch between themes by selecting from a dropdown.
- **Mobile-responsive**: The map and interface adjust to mobile and desktop screens.

## Getting Started

### Prerequisites
- Modern web browser (Google Chrome, Firefox, Safari, etc.)
- Internet connection

### Installation
1. **Clone the repository**:
    ```bash
    git clone https://github.com/toddehalexander/Midpoint
    cd Midpoint
    ```

2. **Open the project**:
   You can directly open the `index.html` file in your web browser.

### API Key (optional)
The project uses the **OpenStreetMap** APIs and does not require an API key. However, if you intend to use a premium geocoding service, you might need to replace the Nominatim API calls with the relevant service and include an API key.

## How It Works

### Main Components

1. **Leaflet Map Setup**:
   - The Leaflet library is used to initialize a world map.
   - OpenStreetMap tiles are added as the base layer for the map.

2. **Search & Autocomplete**:
   - Users can search for two locations using the input boxes.
   - The `autocompleteLocation` function calls Nominatim API to retrieve matching location suggestions based on the user's input.

3. **Midpoint Calculation**:
   - The midpoint is calculated by averaging the latitude and longitude of the two locations.
   - A marker is placed at the midpoint, and the map is zoomed into this area.

4. **Radius and Circle**:
   - Users can specify the search radius in miles. This value is converted to meters using the `milesToMeters` function.
   - A circle is drawn around the midpoint using the specified radius.

5. **Fetching Amenities**:
   - Nearby amenities are fetched using the Overpass API.
   - Amenities within the radius are categorized by type (e.g., cafes, hospitals) and displayed in both a list and on the map as markers.

6. **Distance Calculation**:
   - The `calculateDistance` function computes the distance between the midpoint and each amenity in miles.

### Code Snippets

#### Leaflet Map Initialization
```javascript
var map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
```

#### Autocomplete Function
```javascript
async function autocompleteLocation(inputId, listId) {
    const input = document.getElementById(inputId);
    input.addEventListener('input', async function() {
        const list = document.getElementById(listId);
        list.innerHTML = '';
        if (this.value.length < 3) return; 
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${this.value}`);
        const data = response.data;
        data.forEach(item => {
            const option = document.createElement('div');
            option.textContent = item.display_name;
            option.addEventListener('click', () => {
                input.value = item.display_name;
                list.innerHTML = ''; 
            });
            list.appendChild(option);
        });
    });
}
```

#### Get Amenities via Overpass API
```javascript
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
```

## Usage

1. **Input Locations**: Enter two locations into the input fields. An autocomplete list will help you find the correct location.
2. **Set Radius**: Adjust the radius in miles using the input slider.
3. **Submit**: Click the "Submit" button to calculate the midpoint and display nearby amenities.
4. **View Results**: The map will update with the two location markers, the midpoint, and amenities within the radius.

## Customization

### Theme Selection
Users can switch between different themes by selecting from the dropdown. You can customize themes by editing the corresponding CSS classes in `style.css`.

```javascript
document.getElementById('theme').addEventListener('change', function() {
    document.body.className = this.value;
});
```

## External Libraries

- **Leaflet.js**: Interactive maps.
- **Nominatim API (OpenStreetMap)**: Geocoding for location search and autocomplete.
- **Overpass API**: Fetching amenities around a specific location.
- **Axios**: For making HTTP requests.

## Future Enhancements
- **Additional Filters**: Allow users to filter amenities by category.
- **Save Midpoint**: Provide an option to save the midpoint and nearby amenities to a user's profile (requires backend).
- **Improved Styling**: Add more themes and enhance the overall UI/UX.

## License
This project is licensed under the MIT License.

