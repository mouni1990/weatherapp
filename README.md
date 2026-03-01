# Weather App

A beautiful, modern weather application that displays current weather conditions and a 7-day forecast for any city.

## Features

- **Current Weather**: Temperature, humidity, wind speed, feels-like temperature, and UV index
- **7-Day Forecast**: Daily high/low temperatures with weather icons
- **City Search**: Search any city worldwide
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Last City Memory**: Remembers your last searched city

## Technologies Used

- HTML5, CSS3, JavaScript (Vanilla)
- [Open-Meteo API](https://open-meteo.com/) - Free weather data (no API key required)
- [OpenWeatherMap Icons](https://openweathermap.org/) - Weather icons

## Getting Started

1. Open `index.html` in your web browser
2. Search for a city to see the weather

Or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (npx)
npx serve
```

Then open http://localhost:8000 in your browser.

## API Reference

This app uses the free [Open-Meteo API](https://open-meteo.com/) which:
- Requires no API key
- Provides accurate weather forecasts
- Updates hourly
- Supports worldwide locations

## License

MIT License - Feel free to use and modify as needed.
