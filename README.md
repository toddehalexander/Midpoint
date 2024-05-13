# Midpoint Finder App

The Midpoint Finder App is a simple web application that calculates the midpoint between two locations specified by the user and provides information about accommodations near that midpoint.

## Features

- **Find Midpoint**: Given two locations, the app calculates the geographic midpoint between them and displays it on a map.
- **Display Markers**: The app displays markers on the map for both input locations and the calculated midpoint.
- **Draw Lines**: Draws lines on the map connecting each input location to the midpoint.
- **Display Nearby Accommodations**: Using Google Maps Places API, the app fetches nearby accommodation options (e.g., restaurants, cafes, food places) within a 10-mile radius of the calculated midpoint.
- **Responsive Design**: The app is designed to work on various screen sizes.

## Usage

To use the Midpoint Finder App:

1. Open the web application in a browser.
2. Enter the addresses or locations in the provided input fields.
3. Click the "Find Midpoint" button.
4. The app will calculate the midpoint, display it on the map along with markers for the input locations, draw lines connecting each input location to the midpoint, and display nearby accommodations.
5. You can adjust the zoom level on the map as needed.

## Dependencies

- **Google Maps JavaScript API**: Used for geocoding, mapping, and searching nearby places.
- **Google Maps Places API**: Used for fetching nearby places based on coordinates.

## Setup

1. Ensure you have a valid Google Maps API key with access to Geocoding and Places APIs.
2. Replace `'YOUR_API_KEY'` in the HTML script tag with your actual API key.
3. Host the application files on a web server to run the app.

## Contributing

Feel free to contribute to the project by forking the repository, making improvements, and submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
