const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorText = document.getElementById('error-text');
const weatherContent = document.getElementById('weather-content');
const welcomeEl = document.getElementById('welcome');

const cityNameEl = document.getElementById('city-name');
const currentDateEl = document.getElementById('current-date');
const weatherIconEl = document.getElementById('weather-icon');
const currentTempEl = document.getElementById('current-temp');
const weatherDescEl = document.getElementById('weather-description');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const uvIndexEl = document.getElementById('uv-index');
const forecastContainer = document.getElementById('forecast-container');

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

async function getWeatherData(lat, lon) {
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`
    );
    
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }
    
    return response.json();
}

function displayCurrentWeather(location, weather) {
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
    currentDateEl.textContent = formatDate(new Date().toISOString());
    
    const temp = Math.round(current.temperature_2m);
    currentTempEl.textContent = temp;
    
    weatherIconEl.src = getWeatherIcon(current.weather_code, current.is_day === 1);
    weatherIconEl.alt = getWeatherDescription(current.weather_code);
    weatherDescEl.textContent = getWeatherDescription(current.weather_code);
    
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    uvIndexEl.textContent = daily.uv_index_max[0].toFixed(1);
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
                <span class="forecast-high">${Math.round(daily.temperature_2m_max[i])}°</span>
                <span class="forecast-low">${Math.round(daily.temperature_2m_min[i])}°</span>
            </div>
        `;
        
        forecastContainer.appendChild(forecastItem);
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
        displayForecast(weather);
        showWeather();
        
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

searchBtn.addEventListener('click', () => {
    searchWeather(cityInput.value);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather(cityInput.value);
    }
});

const lastCity = localStorage.getItem('lastCity');
if (lastCity) {
    cityInput.value = lastCity;
    searchWeather(lastCity);
}
