# Weather App - iOS

A native SwiftUI iOS weather app with the same features as the web version.

## Features

- Search any city worldwide
- Current weather with temperature, humidity, wind, feels-like, UV index
- Live local time display (updates every second)
- 7-day forecast
- Beautiful gradient UI matching the web version
- Remembers last searched city

## Requirements

- macOS with Xcode 15.0 or later
- iOS 17.0+ deployment target

## How to Run

1. **Install Xcode** from the Mac App Store (if not installed)
2. Open `WeatherApp.xcodeproj` in Xcode
3. Select a simulator or connect your iPhone
4. Press `Cmd + R` to build and run

## Project Structure

```
WeatherApp-iOS/
├── WeatherApp.xcodeproj/    # Xcode project file
└── WeatherApp/
    ├── WeatherAppApp.swift   # App entry point
    ├── ContentView.swift     # Main UI view
    ├── Models.swift          # Data models
    ├── WeatherService.swift  # API service
    ├── WeatherUtils.swift    # Helper functions
    └── Assets.xcassets/      # App icons & colors
```

## API

Uses the free [Open-Meteo API](https://open-meteo.com/) - no API key required.
