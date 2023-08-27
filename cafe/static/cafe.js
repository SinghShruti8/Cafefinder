const copy = "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
const url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const layer = L.tileLayer(url, { attribution: copy });
const map = L.map("map", { layers: [layer], minZoom: 10 });
map.setView([53.349805, -6.26031], 15); // [Latitude, Longitude], Zoom Levels
map.locate()
    .on("locationfound", (e) => map.setView(e.latlng, 8))
    .on("locationerror", () => map.setView([53.349805, -6.26031], 20));

// Get user's location
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(userLocation);
                },
                (error) => {
                    console.error("Error getting user's location:", error.message);
                    reject(error);
                }
            );
        } else {
            console.log("Geolocation is not available in this browser.");
            reject();
        }
    });
}

// Send user's location to Django view using AJAX
async function sendUserLocationToDjango() {
    try {
        const userLocation = await getUserLocation();
        const response = await fetch(`/cafes/?user_location=${userLocation.lat},${userLocation.lng}`);
        const data = await response.json();
        // Handle the data received from the backend as needed
    } catch (error) {
        console.error("Error sending user's location:", error);
    }
}

// Call the function to send user's location when needed
sendUserLocationToDjango();

async function load_cafes() {
    const cafes_url = `/api/cafes/?in_bbox=${map.getBounds().toBBoxString()}`;
    const response = await fetch(cafes_url);
    const geojson = await response.json();

    // Calculate the distances and sort by distance
    const userLocation = map.getCenter();
    geojson.features.forEach(feature => {
        const cafeLocation = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
        const distance = userLocation.distanceTo(cafeLocation);
        feature.properties.distance = distance;
    });

    // Sort features by distance
    geojson.features.sort((a, b) => a.properties.distance - b.properties.distance);

    // Limit to the nearest ten cafes
    const nearestCafes = geojson.features.slice(0, 10);

    return {
        type: "FeatureCollection",
        features: nearestCafes
    };
}

let markers = null;

async function render_cafes() {
    if (markers) {
        markers.clearLayers();
    }

    const cafes = await load_cafes();
    markers = L.geoJSON(cafes, {
        onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.name);
        }
    }).addTo(map);
}

map.on("moveend", render_cafes);

const searchInput = document.getElementById("cafe-search");
const searchButton = document.getElementById("search-button");

searchButton.addEventListener("click", () => {
    const searchQuery = searchInput.value;
    searchCafe(searchQuery);
});

async function searchCafe(query) {
    if (query.trim() === "") {
        return;
    }

    const cafes_url = `/api/cafes/?search=${query}`;
    const response = await fetch(cafes_url);
    const geojson = await response.json();

    markers.clearLayers();

    L.geoJSON(geojson.features, {
        onEachFeature: (feature, layer) => {
            layer.bindPopup(feature.properties.name);
        }
    }).addTo(markers);

    map.addLayer(markers);
}

