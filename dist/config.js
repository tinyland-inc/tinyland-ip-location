const DEFAULT_GEO_API_URL = 'http://ip-api.com/json';
let _config = {};
export function configure(options) {
    _config = { ..._config, ...options };
}
export function getConfig() {
    return _config;
}
export function getSql() {
    if (!_config.sql) {
        throw new Error('SQL not configured. Call configure({ sql }) before using database functions.');
    }
    return _config.sql;
}
export function getFetch() {
    return _config.fetchFn ?? globalThis.fetch;
}
export function getGeoApiUrl() {
    return _config.geoApiUrl ?? DEFAULT_GEO_API_URL;
}
export function resetConfig() {
    _config = {};
}
