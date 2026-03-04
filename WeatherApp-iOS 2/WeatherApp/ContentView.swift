import SwiftUI

struct ContentView: View {
    @StateObject private var weatherService = WeatherService()
    @State private var searchText = ""
    @State private var localTime = ""
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [Color(hex: "667eea"), Color(hex: "764ba2")]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 20) {
                    searchBar
                    
                    if weatherService.isLoading {
                        loadingView
                    } else if let error = weatherService.errorMessage {
                        errorView(message: error)
                    } else if weatherService.currentWeather != nil {
                        weatherContent
                    } else {
                        welcomeView
                    }
                }
                .padding()
            }
        }
        .onAppear {
            if let lastCity = UserDefaults.standard.string(forKey: "lastCity") {
                searchText = lastCity
                Task {
                    await weatherService.searchCity(lastCity)
                }
            }
        }
        .onReceive(timer) { _ in
            localTime = formatLocalTime(timezone: weatherService.timezone)
        }
    }
    
    private var searchBar: some View {
        HStack {
            TextField("Search city...", text: $searchText)
                .textFieldStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .onSubmit {
                    Task {
                        await weatherService.searchCity(searchText)
                    }
                }
            
            Button {
                Task {
                    await weatherService.searchCity(searchText)
                }
            } label: {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.white)
                    .padding(12)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color(hex: "667eea"), Color(hex: "764ba2")]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
            }
        }
        .background(Color.white.opacity(0.95))
        .cornerRadius(30)
        .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 5)
    }
    
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(.white)
            Text("Fetching weather data...")
                .foregroundColor(.white)
        }
        .padding(60)
    }
    
    private func errorView(message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "xmark.circle")
                .font(.system(size: 48))
                .foregroundColor(.white.opacity(0.8))
            Text(message)
                .foregroundColor(.white)
                .multilineTextAlignment(.center)
        }
        .padding(60)
    }
    
    private var welcomeView: some View {
        VStack(spacing: 20) {
            Image(systemName: "sun.max.fill")
                .font(.system(size: 80))
                .foregroundColor(.white.opacity(0.9))
            Text("Welcome to Weather App")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.white)
            Text("Search for a city to get the weather")
                .foregroundColor(.white.opacity(0.85))
        }
        .padding(60)
    }
    
    @ViewBuilder
    private var weatherContent: some View {
        if let location = weatherService.location,
           let current = weatherService.currentWeather,
           let daily = weatherService.dailyWeather {
            
            VStack(spacing: 20) {
                currentWeatherCard(location: location, current: current, daily: daily)
                forecastCard(daily: daily)
            }
        }
    }
    
    private func currentWeatherCard(location: Location, current: CurrentWeather, daily: DailyWeather) -> some View {
        VStack(spacing: 16) {
            Text(location.fullName)
                .font(.title2)
                .fontWeight(.semibold)
            
            Text(formatLocalDate(timezone: weatherService.timezone))
                .foregroundColor(.secondary)
                .font(.subheadline)
            
            Text("Local time: \(localTime)")
                .font(.callout)
                .fontWeight(.medium)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color(hex: "f0f2ff"))
                .cornerRadius(20)
            
            HStack(spacing: 20) {
                let weatherInfo = getWeatherInfo(code: current.weatherCode)
                Image(systemName: weatherInfo.icon)
                    .font(.system(size: 60))
                    .foregroundColor(weatherInfo.color)
                    .shadow(color: weatherInfo.color.opacity(0.5), radius: 10)
                
                HStack(alignment: .top, spacing: 4) {
                    Text("\(Int(current.temperature2m))")
                        .font(.system(size: 64, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(hex: "667eea"), Color(hex: "764ba2")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    Text("°C")
                        .font(.title)
                        .foregroundColor(.secondary)
                        .padding(.top, 8)
                }
            }
            
            let weatherInfo = getWeatherInfo(code: current.weatherCode)
            Text(weatherInfo.description)
                .font(.title3)
                .foregroundColor(.secondary)
            
            Divider()
                .padding(.vertical, 8)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                detailItem(icon: "humidity.fill", label: "Humidity", value: "\(current.relativeHumidity2m)%")
                detailItem(icon: "wind", label: "Wind", value: "\(Int(current.windSpeed10m)) km/h")
                detailItem(icon: "thermometer.medium", label: "Feels Like", value: "\(Int(current.apparentTemperature))°C")
                detailItem(icon: "sun.max.fill", label: "UV Index", value: String(format: "%.1f", daily.uvIndexMax.first ?? 0))
            }
        }
        .padding(24)
        .background(Color.white.opacity(0.95))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.15), radius: 15, x: 0, y: 8)
    }
    
    private func detailItem(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(Color(hex: "667eea"))
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .fontWeight(.semibold)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private func forecastCard(daily: DailyWeather) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("7-Day Forecast")
                .font(.headline)
            
            ForEach(0..<min(7, daily.time.count), id: \.self) { index in
                HStack {
                    Text(getDayName(from: daily.time[index], timezone: weatherService.timezone))
                        .frame(width: 80, alignment: .leading)
                    
                    let weatherInfo = getWeatherInfo(code: daily.weatherCode[index])
                    Image(systemName: weatherInfo.icon)
                        .foregroundColor(weatherInfo.color)
                        .frame(width: 30)
                    
                    Spacer()
                    
                    Text("\(Int(daily.temperature2mMax[index]))°")
                        .fontWeight(.semibold)
                    
                    Text("\(Int(daily.temperature2mMin[index]))°")
                        .foregroundColor(.secondary)
                }
                
                if index < min(6, daily.time.count - 1) {
                    Divider()
                }
            }
        }
        .padding(24)
        .background(Color.white.opacity(0.95))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.15), radius: 15, x: 0, y: 8)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

#Preview {
    ContentView()
}
