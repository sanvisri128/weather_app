const https = require('https');
const { URL } = require('url');

/**
 * Map Open-Meteo weather codes to human-readable descriptions.
 * @param {number} code - Open-Meteo weather code
 * @returns {string} description
 */
function mapWeatherCode(code) {
  const mapping = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return mapping[code] || 'Unknown';
}

/**
 * Perform an HTTPS GET request and parse JSON response.
 * @param {string} urlString - The URL to request
 * @returns {Promise<any>} Parsed JSON
 */
function httpsGetJson(urlString) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
  });
}

/**
 * Geocode a city name using Open-Meteo Geocoding API.
 * @param {string} city - City name to geocode
 * @returns {Promise<{name:string,country:string,latitude:number,longitude:number}>}
 */
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const data = await httpsGetJson(url);
  if (!data || !data.results || data.results.length === 0) {
    const err = new Error('City not found');
    err.code = 'CITY_NOT_FOUND';
    throw err;
  }
  const r = data.results[0];
  return {
    name: r.name,
    country: r.country || '',
    latitude: r.latitude,
    longitude: r.longitude
  };
}

/**
 * Fetch current weather from Open-Meteo Forecast API.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{temperature:number,windspeed:number,weathercode:number,time:string,description:string}>}
 */
async function fetchWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh`;
  const data = await httpsGetJson(url);
  if (!data || !data.current_weather) {
    const err = new Error('Weather data unavailable');
    err.code = 'WEATHER_UNAVAILABLE';
    throw err;
  }
  const cw = data.current_weather;
  return {
    temperature: cw.temperature,
    windspeed: cw.windspeed,
    weathercode: cw.weathercode,
    time: cw.time,
    description: mapWeatherCode(cw.weathercode)
  };
}

module.exports = {
  geocodeCity,
  fetchWeather
};
