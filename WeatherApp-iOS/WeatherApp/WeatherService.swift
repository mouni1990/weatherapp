import Foundation

class WeatherService: ObservableObject {
    @Published var location: Location?
    @Published var currentWeather: CurrentWeather?
    @Published var dailyWeather: DailyWeather?
    @Published var hourlyWeather: HourlyWeather?
    @Published var timezone: String = "UTC"
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    func searchCity(_ city: String) async {
        guard !city.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let location = try await fetchCoordinates(city: city)
            let weather = try await fetchWeather(lat: location.latitude, lon: location.longitude)
            
            await MainActor.run {
                self.location = location
                self.currentWeather = weather.current
                self.dailyWeather = weather.daily
                self.hourlyWeather = weather.hourly
                self.timezone = weather.timezone
                self.isLoading = false
                UserDefaults.standard.set(city, forKey: "lastCity")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func searchByLocation(lat: Double, lon: Double) async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let location = try await reverseGeocode(lat: lat, lon: lon)
            let weather = try await fetchWeather(lat: lat, lon: lon)
            
            await MainActor.run {
                self.location = location
                self.currentWeather = weather.current
                self.dailyWeather = weather.daily
                self.hourlyWeather = weather.hourly
                self.timezone = weather.timezone
                self.isLoading = false
                UserDefaults.standard.set(location.name, forKey: "lastCity")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func searchByLocation(location: Location) async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        do {
            let weather = try await fetchWeather(lat: location.latitude, lon: location.longitude)
            await MainActor.run {
                self.location = location
                self.currentWeather = weather.current
                self.dailyWeather = weather.daily
                self.hourlyWeather = weather.hourly
                self.timezone = weather.timezone
                self.isLoading = false
                UserDefaults.standard.set(location.name, forKey: "lastCity")
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isLoading = false
            }
        }
    }
    
    func fetchCitySuggestions(query: String) async -> [Location] {
        guard query.count >= 2 else { return [] }
        let encoded = query.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? query
        let urlString = "https://geocoding-api.open-meteo.com/v1/search?name=\(encoded)&count=8&language=en&format=json"
        guard let url = URL(string: urlString) else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(GeocodingResponse.self, from: data)
            return (response.results ?? []).map { r in
                Location(name: r.name, country: r.country ?? "", admin1: r.admin1 ?? "", latitude: r.latitude, longitude: r.longitude)
            }
        } catch {
            return []
        }
    }
    
    private func fetchCoordinates(city: String) async throws -> Location {
        let encodedCity = city.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? city
        let urlString = "https://geocoding-api.open-meteo.com/v1/search?name=\(encodedCity)&count=1&language=en&format=json"
        
        guard let url = URL(string: urlString) else {
            throw WeatherError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        let response = try JSONDecoder().decode(GeocodingResponse.self, from: data)
        
        guard let result = response.results?.first else {
            throw WeatherError.cityNotFound
        }
        
        return Location(
            name: result.name,
            country: result.country ?? "",
            admin1: result.admin1 ?? "",
            latitude: result.latitude,
            longitude: result.longitude
        )
    }
    
    private func reverseGeocode(lat: Double, lon: Double) async throws -> Location {
        let urlString = "https://nominatim.openstreetmap.org/reverse?lat=\(lat)&lon=\(lon)&format=json"
        guard let url = URL(string: urlString) else {
            throw WeatherError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("WeatherApp", forHTTPHeaderField: "User-Agent")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        
        struct NominatimResponse: Codable {
            let address: [String: String]?
        }
        
        let response = try JSONDecoder().decode(NominatimResponse.self, from: data)
        let address = response.address ?? [:]
        
        let name = address["city"] ?? address["town"] ?? address["village"] ?? address["county"] ?? "Your Location"
        let country = address["country"] ?? ""
        let admin1 = address["state"] ?? ""
        
        return Location(
            name: name,
            country: country,
            admin1: admin1,
            latitude: lat,
            longitude: lon
        )
    }
    
    private func fetchWeather(lat: Double, lon: Double) async throws -> WeatherResponse {
        let urlString = "https://api.open-meteo.com/v1/forecast?latitude=\(lat)&longitude=\(lon)&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto"
        
        guard let url = URL(string: urlString) else {
            throw WeatherError.invalidURL
        }
        
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(WeatherResponse.self, from: data)
    }
}

enum WeatherError: LocalizedError {
    case invalidURL
    case cityNotFound
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .cityNotFound:
            return "City not found. Please check the spelling."
        case .networkError:
            return "Network error. Please try again."
        }
    }
}
