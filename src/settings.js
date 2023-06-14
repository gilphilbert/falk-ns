const defaultSettings = {
    enqueueOnClick: true,
    playEmptyQueue: true,
    recentlyAdded: true,
    recentlyPlayed: true,
    mostPlayed: true,
    favorites: true,
    filter: 0
}

export function get(name) {
    if (Object.keys(defaultSettings).includes(name)) {
        const val = JSON.parse(localStorage.getItem(name))
        return val === null ? defaultSettings[name] : val
    } else {
        return null
    }
}

export function set(name, value) {
    localStorage.setItem(name, JSON.stringify(value))
}
