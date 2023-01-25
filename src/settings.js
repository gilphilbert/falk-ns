const defaultSettings = {
    enqueueOnClick: true,
    recentlyAdded: true,
    recentlyPlayed: true,
    mostPlayed: true,
    favorites: true
}

function get(name) {
    if (Object.keys(defaultSettings).includes(name)) {
        const val = JSON.parse(localStorage.getItem(name))
        return val ? val : defaultSettings[name]
    } else {
        return null
    }
}

function set(name, value) {
    localStorage.setItem(name, JSON.stringify(value))
}

function getDefault(name) {

}

module.exports = {
    get,
    set,
    getDefault
}