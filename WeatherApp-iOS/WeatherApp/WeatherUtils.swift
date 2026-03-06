import Foundation
import SwiftUI

var useFahrenheit: Bool {
    get { UserDefaults.standard.bool(forKey: "useFahrenheit") }
    set { UserDefaults.standard.set(newValue, forKey: "useFahrenheit") }
}

func celsiusToFahrenheit(_ celsius: Double) -> Double {
    (celsius * 9/5) + 32
}

func formatTemp(_ celsius: Double) -> Int {
    Int(useFahrenheit ? celsiusToFahrenheit(celsius) : celsius)
}

func tempUnitSymbol() -> String {
    useFahrenheit ? "°F" : "°C"
}

struct WeatherInfo {
    let description: String
    let icon: String
    let color: Color
}

func getWeatherInfo(code: Int) -> WeatherInfo {
    switch code {
    case 0:
        return WeatherInfo(description: "Clear sky", icon: "sun.max.fill", color: .yellow)
    case 1:
        return WeatherInfo(description: "Mainly clear", icon: "sun.max.fill", color: .yellow)
    case 2:
        return WeatherInfo(description: "Partly cloudy", icon: "cloud.sun.fill", color: .orange)
    case 3:
        return WeatherInfo(description: "Overcast", icon: "cloud.fill", color: .gray)
    case 45, 48:
        return WeatherInfo(description: "Foggy", icon: "cloud.fog.fill", color: .gray)
    case 51, 53, 55:
        return WeatherInfo(description: "Drizzle", icon: "cloud.drizzle.fill", color: .blue)
    case 56, 57:
        return WeatherInfo(description: "Freezing drizzle", icon: "cloud.sleet.fill", color: .cyan)
    case 61, 63, 65:
        return WeatherInfo(description: "Rain", icon: "cloud.rain.fill", color: .blue)
    case 66, 67:
        return WeatherInfo(description: "Freezing rain", icon: "cloud.sleet.fill", color: .cyan)
    case 71, 73, 75:
        return WeatherInfo(description: "Snow", icon: "cloud.snow.fill", color: .white)
    case 77:
        return WeatherInfo(description: "Snow grains", icon: "cloud.snow.fill", color: .white)
    case 80, 81, 82:
        return WeatherInfo(description: "Rain showers", icon: "cloud.heavyrain.fill", color: .blue)
    case 85, 86:
        return WeatherInfo(description: "Snow showers", icon: "cloud.snow.fill", color: .white)
    case 95:
        return WeatherInfo(description: "Thunderstorm", icon: "cloud.bolt.fill", color: .purple)
    case 96, 99:
        return WeatherInfo(description: "Thunderstorm with hail", icon: "cloud.bolt.rain.fill", color: .purple)
    default:
        return WeatherInfo(description: "Unknown", icon: "questionmark.circle.fill", color: .gray)
    }
}

func formatLocalTime(timezone: String) -> String {
    let formatter = DateFormatter()
    formatter.timeZone = TimeZone(identifier: timezone)
    formatter.dateFormat = "h:mm:ss a"
    return formatter.string(from: Date())
}

func formatHour(timeString: String, timezone: String) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm"
    formatter.timeZone = TimeZone(identifier: timezone)
    guard let date = formatter.date(from: timeString) else { return timeString }
    formatter.dateFormat = "h a"
    return formatter.string(from: date)
}

func formatLocalDate(timezone: String) -> String {
    let formatter = DateFormatter()
    formatter.timeZone = TimeZone(identifier: timezone)
    formatter.dateFormat = "EEEE, MMMM d, yyyy"
    return formatter.string(from: Date())
}

func getDayName(from dateString: String, timezone: String) -> String {
    let inputFormatter = DateFormatter()
    inputFormatter.dateFormat = "yyyy-MM-dd"
    inputFormatter.timeZone = TimeZone(identifier: timezone)
    
    guard let date = inputFormatter.date(from: dateString) else { return dateString }
    
    let calendar = Calendar.current
    let today = Date()
    
    if calendar.isDate(date, inSameDayAs: today) {
        return "Today"
    }
    
    if let tomorrow = calendar.date(byAdding: .day, value: 1, to: today),
       calendar.isDate(date, inSameDayAs: tomorrow) {
        return "Tomorrow"
    }
    
    let outputFormatter = DateFormatter()
    outputFormatter.dateFormat = "EEE"
    return outputFormatter.string(from: date)
}
