function get(name, defaultval = undefined) {
    const val = JSON.parse(localStorage.getItem(name))
    return val ? val : defaultval
}

function set(name, value) {
    localStorage.setItem(name, JSON.stringify(value))
}

module.exports = {
    get,
    set
}