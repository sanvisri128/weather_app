const { geocodeCity, fetchWeather } = require('./api');

/**
 * Get the city name from command-line arguments.
 * @returns {string|null} The city string or null if missing
 */
function getCityFromArgs() {
  const args = process.argv.slice(2);
  if (!args || args.length === 0) return null;
  return args.join(' ');
}

/**
 * Print usage information to the console.
 */
function printUsage() {
  console.log('Usage: node index.js <city name>');
}

/**
 * Main entrypoint for the CLI app.
 * Reads args, fetches geocoding and weather, and prints results.
 */
async function main() {
  const city = getCityFromArgs();
  if (!city) {
    console.error('Error: No city provided.');
    printUsage();
    process.exitCode = 1;
    return;
  }
  try {
    console.log(`Searching location for: ${city}`);
    const loc = await geocodeCity(city);
    console.log(`Location: ${loc.name}${loc.country ? ', ' + loc.country : ''}`);
    const weather = await fetchWeather(loc.latitude, loc.longitude);
    console.log(`Temperature: ${weather.temperature}°C`);
    console.log(`Conditions: ${weather.description}`);
    console.log(`Wind: ${weather.windspeed} km/h`);
    console.log(`As of: ${weather.time}`);
  } catch (err) {
    if (err && err.code === 'CITY_NOT_FOUND') {
      console.error('Error: City not found. Please check the name and try again.');
      process.exitCode = 2;
    } else if (err && err.code === 'WEATHER_UNAVAILABLE') {
      console.error('Error: Weather data is unavailable for this location.');
      process.exitCode = 3;
    } else {
      console.error('Network or unknown error:', err.message || err);
      process.exitCode = 4;
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCityFromArgs, main };
