import Foundation

class FavoritesManager: ObservableObject {
    @Published var favorites: [Location] = []
    private let key = "favorites"
    
    init() {
        load()
    }
    
    func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode([FavoriteItem].self, from: data) else {
            return
        }
        let loaded = decoded.map { Location(name: $0.name, country: $0.country, admin1: $0.admin1, latitude: $0.lat, longitude: $0.lon) }
        favorites = deduplicate(loaded)
    }
    
    private func deduplicate(_ list: [Location]) -> [Location] {
        var result: [Location] = []
        for loc in list {
            if !result.contains(where: { isSame($0, loc) }) {
                result.append(loc)
            }
        }
        return result
    }
    
    func save() {
        let items = favorites.map { FavoriteItem(name: $0.name, country: $0.country, admin1: $0.admin1, lat: $0.latitude, lon: $0.longitude) }
        if let data = try? JSONEncoder().encode(items) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
    
    func add(_ location: Location) {
        guard !contains(location) else { return }
        favorites.append(location)
        favorites = deduplicate(favorites)
        save()
    }
    
    func remove(_ location: Location) {
        favorites.removeAll { isSame($0, location) }
        save()
    }
    
    func contains(_ location: Location) -> Bool {
        favorites.contains { isSame($0, location) }
    }
    
    func toggle(_ location: Location) {
        if contains(location) {
            remove(location)
        } else {
            add(location)
        }
    }
    
    private func isSame(_ a: Location, _ b: Location) -> Bool {
        guard a.name == b.name && a.country == b.country else { return false }
        return abs(a.latitude - b.latitude) < 0.01 && abs(a.longitude - b.longitude) < 0.01
    }
}

private struct FavoriteItem: Codable {
    let name: String
    let country: String
    let admin1: String
    let lat: Double
    let lon: Double
}
