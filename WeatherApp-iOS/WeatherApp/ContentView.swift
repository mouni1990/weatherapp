import SwiftUI

struct ContentView: View {
    @StateObject private var weatherService = WeatherService()
    @StateObject private var locationManager = LocationManager()
    @StateObject private var favoritesManager = FavoritesManager()
    @State private var searchText = ""
    @State private var localTime = ""
    @State private var citySuggestions: [Location] = []
    
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
            locationManager.requestLocation()
        }
        .onChange(of: locationManager.location) { _, newLocation in
            if let coord = newLocation {
                Task {
                    await weatherService.searchByLocation(lat: coord.latitude, lon: coord.longitude)
                    await MainActor.run {
                        searchText = weatherService.location?.name ?? ""
                    }
                }
            }
        }
        .onChange(of: locationManager.errorMessage) { _, _ in
            if locationManager.location == nil,
               let lastCity = UserDefaults.standard.string(forKey: "lastCity"),
               !lastCity.isEmpty {
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
        VStack(spacing: 16) {
            HStack {
                Text("Weather")
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Spacer()
                
                HStack(spacing: 4) {
                    Button {
                        if useFahrenheit {
                            useFahrenheit = false
                            weatherService.objectWillChange.send()
                        }
                    } label: {
                        Text("°C")
                            .font(.callout)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(useFahrenheit ? Color.clear : Color.white)
                            .foregroundColor(useFahrenheit ? .white.opacity(0.8) : Color(hex: "667eea"))
                            .cornerRadius(16)
                    }
                    
                    Button {
                        if !useFahrenheit {
                            useFahrenheit = true
                            weatherService.objectWillChange.send()
                        }
                    } label: {
                        Text("°F")
                            .font(.callout)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(useFahrenheit ? Color.white : Color.clear)
                            .foregroundColor(useFahrenheit ? Color(hex: "667eea") : .white.opacity(0.8))
                            .cornerRadius(16)
                    }
                }
            }
            
            HStack {
                Button {
                    locationManager.requestLocation()
                } label: {
                    Image(systemName: "location.fill")
                        .foregroundColor(Color(hex: "667eea"))
                        .font(.system(size: 18))
                }
                
                VStack(alignment: .leading, spacing: 0) {
                    TextField("Search city...", text: $searchText)
                        .textFieldStyle(.plain)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .onChange(of: searchText) { _, newValue in
                            if newValue.count >= 2 {
                                Task {
                                    let results = await weatherService.fetchCitySuggestions(query: newValue)
                                    await MainActor.run {
                                        citySuggestions = results
                                    }
                                }
                            } else {
                                citySuggestions = []
                            }
                        }
                        .onSubmit {
                            citySuggestions = []
                            Task {
                                await weatherService.searchCity(searchText)
                            }
                        }
                    
                    if !citySuggestions.isEmpty {
                        VStack(spacing: 0) {
                            ForEach(citySuggestions.indices, id: \.self) { i in
                                let loc = citySuggestions[i]
                                Button {
                                    citySuggestions = []
                                    searchText = loc.name
                                    Task {
                                        await weatherService.searchByLocation(location: loc)
                                    }
                                } label: {
                                    HStack {
                                        Text("\(loc.name)\(loc.admin1.isEmpty ? "" : ", \(loc.admin1)")\(loc.country.isEmpty ? "" : ", \(loc.country)")")
                                            .font(.subheadline)
                                            .foregroundColor(.primary)
                                            .lineLimit(1)
                                        Spacer()
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 12)
                                }
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(radius: 8)
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
            .padding(8)
            .background(Color.white.opacity(0.95))
            .cornerRadius(30)
            .shadow(color: .black.opacity(0.15), radius: 10, x: 0, y: 5)
            
            if !favoritesManager.favorites.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(favoritesManager.favorites.enumerated()), id: \.offset) { _, fav in
                            Button {
                                Task {
                                    await weatherService.searchByLocation(location: fav)
                                }
                            } label: {
                                Text(fav.name)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.white.opacity(0.2))
                                    .foregroundColor(.white)
                                    .cornerRadius(16)
                            }
                        }
                    }
                }
            }
        }
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
            Text(weatherService.isLoading ? "Detecting your location..." : "Search for a city or tap the location icon")
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
                if let hourly = weatherService.hourlyWeather {
                    hourlyCard(hourly: hourly)
                }
                forecastCard(daily: daily)
            }
        }
    }
    
    private func currentWeatherCard(location: Location, current: CurrentWeather, daily: DailyWeather) -> some View {
        VStack(spacing: 16) {
            HStack {
                Text(location.fullName)
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Button {
                    favoritesManager.toggle(location)
                } label: {
                    Image(systemName: favoritesManager.contains(location) ? "star.fill" : "star")
                        .foregroundColor(favoritesManager.contains(location) ? .yellow : .gray)
                        .font(.title3)
                }
            }
            
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
                    Text("\(formatTemp(current.temperature2m))")
                        .font(.system(size: 64, weight: .bold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(hex: "667eea"), Color(hex: "764ba2")],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    Text(tempUnitSymbol())
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
                detailItem(icon: "thermometer.medium", label: "Feels Like", value: "\(formatTemp(current.apparentTemperature))\(tempUnitSymbol())")
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
    
    private func hourlyCard(hourly: HourlyWeather) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Hourly Forecast")
                .font(.headline)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(0..<min(24, hourly.time.count), id: \.self) { i in
                        VStack(spacing: 6) {
                            Text(formatHour(timeString: hourly.time[i], timezone: weatherService.timezone))
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            let code = i < hourly.weatherCode.count ? hourly.weatherCode[i] : 0
                            let info = getWeatherInfo(code: code)
                            Image(systemName: info.icon)
                                .font(.body)
                                .foregroundColor(info.color)
                            
                            Text("\(formatTemp(hourly.temperature2m[i]))°")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            
                            if let pop = hourly.precipitationProbability, i < pop.count {
                                Text("\(pop[i])%")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .frame(width: 56)
                        .padding(.vertical, 8)
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                    }
                }
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.95))
        .cornerRadius(24)
        .shadow(color: .black.opacity(0.15), radius: 15, x: 0, y: 8)
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
                    
                    Text("\(formatTemp(daily.temperature2mMax[index]))°")
                        .fontWeight(.semibold)
                    
                    Text("\(formatTemp(daily.temperature2mMin[index]))°")
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
