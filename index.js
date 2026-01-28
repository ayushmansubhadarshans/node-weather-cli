const https = require('https');

/**
 * Fetches weather data for a given city using the Open-Meteo API
 * @param {string} city - The city name to fetch weather for
 * @returns {Promise<void>}
 */
async function getWeather(city) {
  // Validate input
  if (!city || city.trim().length === 0) {
    console.error('Error: Please provide a city name');
    console.error('Usage: node index.js "City Name"');
    process.exit(1);
  }

  try {
    // Step 1: Geocode the city name to get coordinates
    console.log(`Fetching weather data for ${city}...`);
    const coordinates = await geocodeCity(city);

    if (!coordinates) {
      console.error(`Error: City "${city}" not found`);
      process.exit(1);
    }

    // Step 2: Fetch weather data using the coordinates
    const weatherData = await fetchWeatherData(coordinates.latitude, coordinates.longitude);

    // Step 3: Display the weather information
    displayWeather(city, weatherData);
  } catch (error) {
    console.error(`Error: Failed to fetch weather data - ${error.message}`);
    process.exit(1);
  }
}

/**
 * Geocodes a city name to get latitude and longitude
 * @param {string} city - The city name
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
function geocodeCity(city) {
  return new Promise((resolve, reject) => {
    const encodedCity = encodeURIComponent(city);
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedCity}&count=1&language=en&format=json`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            const location = result.results[0];
            resolve({
              latitude: location.latitude,
              longitude: location.longitude,
              name: location.name,
              country: location.country,
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(new Error('Failed to parse geocoding response'));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Network error during geocoding: ${error.message}`));
    });
  });
}

/**
 * Fetches weather data for given coordinates
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<{temperature: number, weatherCode: number, windSpeed: number}>}
 */
function fetchWeatherData(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const current = result.current;
          resolve({
            temperature: current.temperature_2m,
            weatherCode: current.weather_code,
            windSpeed: current.wind_speed_10m,
          });
        } catch (error) {
          reject(new Error('Failed to parse weather response'));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Network error during weather fetch: ${error.message}`));
    });
  });
}

/**
 * Converts WMO weather code to human-readable description
 * @param {number} code - WMO weather code
 * @returns {string}
 */
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with rime',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return weatherCodes[code] || 'Unknown weather';
}

/**
 * Displays the weather information to the console
 * @param {string} city - The city name
 * @param {object} weatherData - The weather data object
 */
function displayWeather(city, weatherData) {
  const { temperature, weatherCode, windSpeed } = weatherData;
  const description = getWeatherDescription(weatherCode);

  console.log(`\nWeather in ${city}: ${temperature}°C, ${description}`);
  console.log(`Wind speed: ${windSpeed} km/h\n`);
}

// Main execution
const city = process.argv[2];
getWeather(city);
