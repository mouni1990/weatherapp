const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorText = document.getElementById('error-text');
const weatherContent = document.getElementById('weather-content');
const welcomeEl = document.getElementById('welcome');
const welcomeLoading = document.getElementById('welcome-loading');

const cityNameEl = document.getElementById('city-name');
const currentDateEl = document.getElementById('current-date');
const localTimeEl = document.getElementById('local-time');
const weatherIconEl = document.getElementById('weather-icon');
const currentTempEl = document.getElementById('current-temp');
const tempUnitEl = document.getElementById('temp-unit');
const weatherDescEl = document.getElementById('weather-description');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const uvIndexEl = document.getElementById('uv-index');
const forecastContainer = document.getElementById('forecast-container');
const citySuggestionsEl = document.getElementById('city-suggestions');
const favoritesEl = document.getElementById('favorites');
const favoriteBtn = document.getElementById('favorite-btn');
const hourlyContainer = document.getElementById('hourly-container');

let currentTimezone = null;
let timeUpdateInterval = null;
let currentWeatherData = null;
let currentLocationData = null;
let useFahrenheit = localStorage.getItem('useFahrenheit') === 'true';
let suggestionsDebounce = null;

function getFavorites() {
    try {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
}

function addFavorite(location) {
    const favs = getFavorites();
    const key = `${location.name}|${location.country}|${location.lat}|${location.lon}`;
    if (favs.some(f => `${f.name}|${f.country}|${f.lat}|${f.lon}` === key)) return;
    favs.push({ name: location.name, country: location.country, admin1: location.admin1 || '', lat: location.lat, lon: location.lon });
    saveFavorites(favs);
    renderFavorites();
}

function removeFavorite(location) {
    const favs = getFavorites().filter(f => !(f.name === location.name && f.country === location.country && f.lat === location.lat && f.lon === location.lon));
    saveFavorites(favs);
    renderFavorites();
}

function isFavorite(location) {
    if (!location) return false;
    return getFavorites().some(f => f.name === location.name && f.country === location.country && Math.abs(f.lat - location.lat) < 0.01 && Math.abs(f.lon - location.lon) < 0.01);
}

function updateFavoriteButton() {
    if (!favoriteBtn) return;
    const icon = document.getElementById('favorite-icon');
    if (!icon) return;
    if (isFavorite(currentLocationData)) {
        favoriteBtn.classList.add('is-favorite');
        icon.setAttribute('fill', 'currentColor');
    } else {
        favoriteBtn.classList.remove('is-favorite');
        icon.removeAttribute('fill');
    }
}

function renderFavorites() {
    favoritesEl.innerHTML = '';
    const favs = getFavorites();
    favs.forEach(fav => {
        const chip = document.createElement('button');
        chip.className = 'favorite-chip';
        chip.textContent = fav.name;
        chip.addEventListener('click', () => searchWeatherByLocation(fav));
        favoritesEl.appendChild(chip);
    });
}

const weatherCodes = {
    0: { description: 'Clear sky', icon: '01d' },
    1: { description: 'Mainly clear', icon: '01d' },
    2: { description: 'Partly cloudy', icon: '02d' },
    3: { description: 'Overcast', icon: '03d' },
    45: { description: 'Foggy', icon: '50d' },
    48: { description: 'Depositing rime fog', icon: '50d' },
    51: { description: 'Light drizzle', icon: '09d' },
    53: { description: 'Moderate drizzle', icon: '09d' },
    55: { description: 'Dense drizzle', icon: '09d' },
    56: { description: 'Light freezing drizzle', icon: '09d' },
    57: { description: 'Dense freezing drizzle', icon: '09d' },
    61: { description: 'Slight rain', icon: '10d' },
    63: { description: 'Moderate rain', icon: '10d' },
    65: { description: 'Heavy rain', icon: '10d' },
    66: { description: 'Light freezing rain', icon: '13d' },
    67: { description: 'Heavy freezing rain', icon: '13d' },
    71: { description: 'Slight snow', icon: '13d' },
    73: { description: 'Moderate snow', icon: '13d' },
    75: { description: 'Heavy snow', icon: '13d' },
    77: { description: 'Snow grains', icon: '13d' },
    80: { description: 'Slight rain showers', icon: '09d' },
    81: { description: 'Moderate rain showers', icon: '09d' },
    82: { description: 'Violent rain showers', icon: '09d' },
    85: { description: 'Slight snow showers', icon: '13d' },
    86: { description: 'Heavy snow showers', icon: '13d' },
    95: { description: 'Thunderstorm', icon: '11d' },
    96: { description: 'Thunderstorm with slight hail', icon: '11d' },
    99: { description: 'Thunderstorm with heavy hail', icon: '11d' }
};

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function formatTemp(celsius) {
    if (useFahrenheit) {
        return Math.round(celsiusToFahrenheit(celsius));
    }
    return Math.round(celsius);
}

function getWeatherIcon(code, isDay = true) {
    const weather = weatherCodes[code] || { icon: '01d' };
    let icon = weather.icon;
    if (!isDay) {
        icon = icon.replace('d', 'n');
    }
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

function getWeatherDescription(code) {
    return weatherCodes[code]?.description || 'Unknown';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatLocalTime(timezone) {
    const now = new Date();
    return now.toLocaleString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function formatLocalDate(timezone) {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateLocalTime() {
    if (currentTimezone) {
        localTimeEl.textContent = `Local time: ${formatLocalTime(currentTimezone)}`;
    }
}

function startTimeUpdates(timezone) {
    currentTimezone = timezone;
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
    }
    updateLocalTime();
    timeUpdateInterval = setInterval(updateLocalTime, 1000);
}

function updateUnitButtons() {
    if (useFahrenheit) {
        celsiusBtn.classList.remove('active');
        fahrenheitBtn.classList.add('active');
        tempUnitEl.textContent = '°F';
    } else {
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
        tempUnitEl.textContent = '°C';
    }
}

function showLoading() {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    weatherContent.classList.add('hidden');
    welcomeEl.classList.add('hidden');
}

function showError(message) {
    loadingEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    weatherContent.classList.add('hidden');
    welcomeEl.classList.add('hidden');
    errorText.textContent = message;
}

function showWeather() {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    weatherContent.classList.remove('hidden');
    welcomeEl.classList.add('hidden');
}

function showWelcome(message = 'Search for a city to get the current weather and forecast') {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    weatherContent.classList.add('hidden');
    welcomeEl.classList.remove('hidden');
    welcomeEl.querySelector('p').textContent = message;
    welcomeLoading.classList.add('hidden');
}

async function getCoordinates(city) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch location data');
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found');
    }
    
    const result = data.results[0];
    return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name,
        country: result.country || '',
        admin1: result.admin1 || ''
    };
}

async function reverseGeocode(lat, lon) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    
    if (!response.ok) {
        throw new Error('Failed to get location name');
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    return {
        lat: lat,
        lon: lon,
        name: address.city || address.town || address.village || address.county || 'Your Location',
        country: address.country || '',
        admin1: address.state || ''
    };
}

async function getCitySuggestions(query) {
    if (!query || query.length < 2) return [];
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
    );
    const data = await response.json();
    return data.results || [];
}

async function getWeatherData(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }
    
    return response.json();
}

function displayCurrentWeather(location, weather) {
    currentWeatherData = weather;
    currentLocationData = location;
    
    const current = weather.current;
    const daily = weather.daily;
    
    let locationText = location.name;
    if (location.admin1) {
        locationText += `, ${location.admin1}`;
    }
    if (location.country) {
        locationText += `, ${location.country}`;
    }
    
    cityNameEl.textContent = locationText;
    currentDateEl.textContent = formatLocalDate(weather.timezone);
    startTimeUpdates(weather.timezone);
    
    currentTempEl.textContent = formatTemp(current.temperature_2m);
    
    weatherIconEl.src = getWeatherIcon(current.weather_code, current.is_day === 1);
    weatherIconEl.alt = getWeatherDescription(current.weather_code);
    weatherDescEl.textContent = getWeatherDescription(current.weather_code);
    
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    feelsLikeEl.textContent = `${formatTemp(current.apparent_temperature)}°${useFahrenheit ? 'F' : 'C'}`;
    uvIndexEl.textContent = daily.uv_index_max[0].toFixed(1);
}

function formatHour(timeString, timezone) {
    const date = new Date(timeString);
    return date.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: true });
}

function displayHourlyForecast(weather) {
    const hourly = weather.hourly;
    if (!hourly || !hourly.time || hourly.time.length === 0) return;
    hourlyContainer.innerHTML = '';
    const end = Math.min(24, hourly.time.length);
    for (let i = 0; i < end; i++) {
        const item = document.createElement('div');
        item.className = 'hourly-item';
        const isDay = i >= 6 && i < 20;
        item.innerHTML = `
            <div class="hourly-time">${formatHour(hourly.time[i], weather.timezone)}</div>
            <img class="hourly-icon" src="${getWeatherIcon(hourly.weather_code[i] ?? 0, isDay)}" alt="">
            <div class="hourly-temp">${formatTemp(hourly.temperature_2m[i])}°</div>
            <div class="hourly-pop">${(hourly.precipitation_probability?.[i] ?? 0)}%</div>
        `;
        hourlyContainer.appendChild(item);
    }
}

function displayForecast(weather) {
    const daily = weather.daily;
    forecastContainer.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${formatDay(daily.time[i])}</div>
            <img class="forecast-icon" src="${getWeatherIcon(daily.weather_code[i])}" alt="${getWeatherDescription(daily.weather_code[i])}">
            <div class="forecast-temps">
                <span class="forecast-high">${formatTemp(daily.temperature_2m_max[i])}°</span>
                <span class="forecast-low">${formatTemp(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    }
}

function refreshDisplay() {
    if (currentWeatherData && currentLocationData) {
        displayCurrentWeather(currentLocationData, currentWeatherData);
        displayHourlyForecast(currentWeatherData);
        displayForecast(currentWeatherData);
    }
}

async function searchWeather(city) {
    if (!city.trim()) {
        return;
    }
    
    showLoading();
    
    try {
        const location = await getCoordinates(city);
        const weather = await getWeatherData(location.lat, location.lon);
        
        displayCurrentWeather(location, weather);
        displayHourlyForecast(weather);
        displayForecast(weather);
        showWeather();
        updateFavoriteButton();
        
        localStorage.setItem('lastCity', city);
    } catch (error) {
        console.error('Error fetching weather:', error);
        if (error.message === 'City not found') {
            showError('City not found. Please check the spelling and try again.');
        } else {
            showError('Failed to fetch weather data. Please try again later.');
        }
    }
}

async function searchWeatherByLocation(loc) {
    showLoading();
    try {
        const weather = await getWeatherData(loc.lat, loc.lon);
        const location = { lat: loc.lat, lon: loc.lon, name: loc.name, country: loc.country || '', admin1: loc.admin1 || '' };
        displayCurrentWeather(location, weather);
        displayHourlyForecast(weather);
        displayForecast(weather);
        showWeather();
        updateFavoriteButton();
        cityInput.value = loc.name;
        citySuggestionsEl.classList.add('hidden');
    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
    }
}

async function searchWeatherByCoords(lat, lon) {
    showLoading();
    
    try {
        const location = await reverseGeocode(lat, lon);
        const weather = await getWeatherData(lat, lon);
        
        displayCurrentWeather(location, weather);
        displayHourlyForecast(weather);
        displayForecast(weather);
        showWeather();
        updateFavoriteButton();
        
        cityInput.value = location.name;
    } catch (error) {
        console.error('Error fetching weather:', error);
        showError('Failed to fetch weather data. Please try again later.');
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        showWelcome('Geolocation is not supported. Search for a city instead.');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await searchWeatherByCoords(latitude, longitude);
        },
        (error) => {
            console.error('Geolocation error:', error);
            let message = 'Search for a city to get the current weather and forecast';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Location access denied. Search for a city instead.';
            }
            showWelcome(message);
            
            const lastCity = localStorage.getItem('lastCity');
            if (lastCity) {
                cityInput.value = lastCity;
                searchWeather(lastCity);
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
}

searchBtn.addEventListener('click', () => {
    citySuggestionsEl.classList.add('hidden');
    searchWeather(cityInput.value);
});

cityInput.addEventListener('input', () => {
    clearTimeout(suggestionsDebounce);
    const q = cityInput.value.trim();
    if (q.length < 2) {
        citySuggestionsEl.classList.add('hidden');
        return;
    }
    suggestionsDebounce = setTimeout(async () => {
        const results = await getCitySuggestions(q);
        citySuggestionsEl.innerHTML = '';
        if (results.length === 0) {
            citySuggestionsEl.classList.add('hidden');
            return;
        }
        results.forEach(r => {
            const li = document.createElement('button');
            li.className = 'suggestion-item';
            li.textContent = `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`;
            li.addEventListener('click', () => {
                searchWeatherByLocation({ name: r.name, country: r.country || '', admin1: r.admin1 || '', lat: r.latitude, lon: r.longitude });
            });
            citySuggestionsEl.appendChild(li);
        });
        citySuggestionsEl.classList.remove('hidden');
    }, 300);
});

cityInput.addEventListener('focus', () => {
    if (citySuggestionsEl.children.length > 0) citySuggestionsEl.classList.remove('hidden');
});

cityInput.addEventListener('blur', () => {
    setTimeout(() => citySuggestionsEl.classList.add('hidden'), 200);
});

favoriteBtn?.addEventListener('click', () => {
    if (!currentLocationData) return;
    if (isFavorite(currentLocationData)) {
        removeFavorite(currentLocationData);
    } else {
        addFavorite(currentLocationData);
    }
    updateFavoriteButton();
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather(cityInput.value);
    }
});

locationBtn.addEventListener('click', () => {
    getCurrentLocation();
});

celsiusBtn.addEventListener('click', () => {
    if (useFahrenheit) {
        useFahrenheit = false;
        localStorage.setItem('useFahrenheit', 'false');
        updateUnitButtons();
        refreshDisplay();
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (!useFahrenheit) {
        useFahrenheit = true;
        localStorage.setItem('useFahrenheit', 'true');
        updateUnitButtons();
        refreshDisplay();
    }
});

updateUnitButtons();
renderFavorites();
getCurrentLocation();
