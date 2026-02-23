



















import type { IpLocationConfig } from './types.js';





const DEFAULT_GEO_API_URL = 'http://ip-api.com/json';





let _config: IpLocationConfig = {};









export function configure(options: IpLocationConfig): void {
	_config = { ..._config, ...options };
}





export function getConfig(): IpLocationConfig {
	return _config;
}






export function getSql(): NonNullable<IpLocationConfig['sql']> {
	if (!_config.sql) {
		throw new Error(
			'SQL not configured. Call configure({ sql }) before using database functions.'
		);
	}
	return _config.sql;
}





export function getFetch(): typeof fetch {
	return _config.fetchFn ?? globalThis.fetch;
}





export function getGeoApiUrl(): string {
	return _config.geoApiUrl ?? DEFAULT_GEO_API_URL;
}





export function resetConfig(): void {
	_config = {};
}
