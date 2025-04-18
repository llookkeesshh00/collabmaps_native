// routeTest.js - A script to generate route data for testing
const axios = require('axios');
const polyline = require('@mapbox/polyline');
const fs = require('fs');

// Get API key from app.config.js if possible
let GOOGLE_MAPS_API_KEY;
try {
  const appConfig = require('./app.config.js');
  GOOGLE_MAPS_API_KEY = AIzaSyAR8Sxn_UmTfySxL4DT1RefR8j-QYGntpA;
  console.log("Found API key from app.config.js");
} catch (error) {
  console.log("Could not load API key from app.config.js, using environment variable or default");
  GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';
}

// Test coordinates - using various starting points with Vasavi College of Engineering as destination
const testRoutes = [
  {
    name: "Route 1 - Hyderabad City Center to Vasavi College",
    source: { latitude: 17.385044, longitude: 78.486671 }, // Hyderabad City Center
    destination: { latitude: 17.329731, longitude: 78.337190 }, // Vasavi College of Engineering
    mode: "car"
  },
  {
    name: "Route 2 - Banjara Hills to Vasavi College",
    source: { latitude: 17.410922, longitude: 78.447485 }, // Banjara Hills
    destination: { latitude: 17.329731, longitude: 78.337190 }, // Vasavi College of Engineering
    mode: "car"
  },
  {
    name: "Route 3 - Osmania University to Vasavi College",
    source: { latitude: 17.406487, longitude: 78.490768 }, // Osmania University
    destination: { latitude: 17.329731, longitude: 78.337190 }, // Vasavi College of Engineering
    mode: "car"
  },
  {
    name: "Route 4 - Airport to Vasavi College",
    source: { latitude: 17.240263, longitude: 78.429385 }, // Rajiv Gandhi International Airport
    destination: { latitude: 17.329731, longitude: 78.337190 }, // Vasavi College of Engineering
    mode: "car"
  }
];

// Convert mode to Google Maps API format
function getGoogleMode(mode) {
  switch (mode) {
    case 'bike': return 'bicycling';
    case 'car': return 'driving';
    case 'walk': return 'walking';
    case 'transit': case 'train': return 'transit';
    default: return 'driving';
  }
}

// Generate a single route
async function generateRoute(routeConfig) {
  try {
    const { source, destination, mode, name } = routeConfig;
    const googleMode = getGoogleMode(mode);
    
    console.log(`\n--------------------------------------`);
    console.log(`Generating ${name} with mode: ${mode} (${googleMode})...`);
    console.log(`From: ${source.latitude},${source.longitude}`);
    console.log(`To: ${destination.latitude},${destination.longitude}`);
    console.log(`API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 5)}...${GOOGLE_MAPS_API_KEY.substring(GOOGLE_MAPS_API_KEY.length - 5)}`);
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${source.latitude},${source.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${googleMode}&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log(`Making API request...`);
    const response = await axios.get(url);
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response status text: ${response.statusText}`);
    
    // Check for API error
    if (response.data.status !== 'OK') {
      console.error(`API Error: ${response.data.status}`);
      console.error(`Error message: ${response.data.error_message || 'No detailed error message'}`);
      return null;
    }
    
    if (!response.data.routes || response.data.routes.length === 0) {
      console.error(`No routes returned from API`);
      return null;
    }
    
    const route = response.data.routes[0];
    
    if (!route) {
      console.error(`No route found for ${name}`);
      return null;
    }
    
    console.log(`Route found! Summary: ${route.summary}`);
    console.log(`Steps: ${route.legs[0].steps.length}`);
    
    const points = polyline.decode(route.overview_polyline.points);
    const coords = points.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));
    
    console.log(`Decoded ${coords.length} coordinates from polyline`);
    
    const duration = route.legs[0].duration.value;
    const distance = route.legs[0].distance.value;
    
    console.log(`Duration: ${duration} seconds (${route.legs[0].duration.text})`);
    console.log(`Distance: ${distance} meters (${route.legs[0].distance.text})`);
    
    // Format route data for WebSocket testing
    const routeData = {
      type: "UPDATE_ROUTE",
      payload: {
        userId: `test-user-${name.replace(/\s+/g, '-').toLowerCase()}`,
        roomId: "test-room-id",
        route: {
          points: coords,
          duration: duration.toString(),
          distance: distance.toString(),
          mode: mode
        }
      }
    };
    
    // Log the route data for WebSocket testing
    console.log(`\n=== ${name} ROUTE DATA ===`);
    console.log(JSON.stringify(routeData, null, 2));
    
    // Log the simplified format for updateRoute()
    console.log(`\n=== ${name} SIMPLIFIED ROUTE DATA ===`);
    console.log(JSON.stringify({
      points: coords,
      duration: duration.toString(),
      distance: distance.toString(),
      mode: mode
    }, null, 2));
    
    return routeData;
  } catch (error) {
    console.error(`Error generating route:`, error.message);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    return null;
  }
}

// Generate all routes and save to file
async function generateAllRoutes() {
  console.log("Generating routes for testing...");
  console.log(`Using Google Maps API Key: ${GOOGLE_MAPS_API_KEY ? 'YES (masked)' : 'NO'}`);
  
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error("\nERROR: No valid Google Maps API key provided!");
    console.error("Please set your API key in app.config.js or as an environment variable.");
    return;
  }
  
  const results = [];
  
  for (const route of testRoutes) {
    const routeData = await generateRoute(route);
    if (routeData) {
      results.push(routeData);
    }
  }
  
  // Save to file
  if (results.length > 0) {
    fs.writeFileSync('routeTestData.json', JSON.stringify(results, null, 2));
    console.log("\nAll routes generated and saved to routeTestData.json");
    console.log(`Successfully generated ${results.length} of ${testRoutes.length} routes`);
  } else {
    console.error("\nFailed to generate any routes!");
  }
}

// Check if the script is running directly or included as a module
if (require.main === module) {
  // Create a .env file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log("No .env file found. Creating a template .env file...");
    fs.writeFileSync('.env', 'GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE\n');
    console.error("\nPlease edit the .env file and add your Google Maps API key, then run this script again.");
    process.exit(1);
  }
  
  // If we get here, run the script
  generateAllRoutes().catch(console.error);
}