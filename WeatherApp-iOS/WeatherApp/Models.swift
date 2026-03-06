import Foundation

struct GeocodingResponse: Codable {
    let results: [GeocodingResult]?
}

struct GeocodingResult: Codable {
    let name: String
    let latitude: Double
    let longitude: Double
    let country: String?
    let admin1: String?
}

struct WeatherResponse: Codable {
    let current: CurrentWeather
    let daily: DailyWeather
    let hourly: HourlyWeather?
    let timezone: String
}

struct HourlyWeather: Codable {
    let time: [String]
    let temperature2m: [Double]
    let weatherCode: [Int]
    let precipitationProbability: [Int]?
    
    enum CodingKeys: String, CodingKey {
        case time
        case temperature2m = "temperature_2m"
        case weatherCode = "weather_code"
        case precipitationProbability = "precipitation_probability"
    }
}

struct CurrentWeather: Codable {
    let temperature2m: Double
    let relativeHumidity2m: Int
    let apparentTemperature: Double
    let weatherCode: Int
    let windSpeed10m: Double
    let isDay: Int
    
    enum CodingKeys: String, CodingKey {
        case temperature2m = "temperature_2m"
        case relativeHumidity2m = "relative_humidity_2m"
        case apparentTemperature = "apparent_temperature"
        case weatherCode = "weather_code"
        case windSpeed10m = "wind_speed_10m"
        case isDay = "is_day"
    }
}

struct DailyWeather: Codable {
    let time: [String]
    let weatherCode: [Int]
    let temperature2mMax: [Double]
    let temperature2mMin: [Double]
    let uvIndexMax: [Double]
    
    enum CodingKeys: String, CodingKey {
        case time
        case weatherCode = "weather_code"
        case temperature2mMax = "temperature_2m_max"
        case temperature2mMin = "temperature_2m_min"
        case uvIndexMax = "uv_index_max"
    }
}

struct Location {
    let name: String
    let country: String
    let admin1: String
    let latitude: Double
    let longitude: Double
    
    var fullName: String {
        var parts = [name]
        if !admin1.isEmpty { parts.append(admin1) }
        if !country.isEmpty { parts.append(country) }
        return parts.joined(separator: ", ")
    }
}

struct DayForecast: Identifiable {
    let id = UUID()
    let date: String
    let dayName: String
    let weatherCode: Int
    let highTemp: Int
    let lowTemp: Int
}
