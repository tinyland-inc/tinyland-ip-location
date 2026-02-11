/**
 * Global DI configuration for @tinyland-inc/tinyland-ip-location
 *
 * Provides a singleton configuration store that allows injection
 * of database SQL tagged template, custom fetch, and API URL.
 *
 * Usage:
 * ```typescript
 * import { configure } from '@tinyland-inc/tinyland-ip-location';
 *
 * configure({
 *   sql: neonSql,
 *   geoApiUrl: 'http://ip-api.com/json',
 *   fetchFn: customFetch,
 * });
 * ```
 *
 * @module config
 */

import type { IpLocationConfig } from './types.js';

// ============================================================================
// Default configuration
// ============================================================================

const DEFAULT_GEO_API_URL = 'http://ip-api.com/json';

// ============================================================================
// Global state
// ============================================================================

let _config: IpLocationConfig = {};

// ============================================================================
// Public API
// ============================================================================

/**
 * Configure the ip-location package with dependencies.
 * Call this once during application startup before using database-dependent functions.
 */
export function configure(options: IpLocationConfig): void {
	_config = { ..._config, ...options };
}

/**
 * Get the current configuration.
 * @internal Used by modules to read injected config.
 */
export function getConfig(): IpLocationConfig {
	return _config;
}

/**
 * Get the configured SQL tagged template function.
 * @throws {Error} If SQL is not configured.
 * @internal
 */
export function getSql(): NonNullable<IpLocationConfig['sql']> {
	if (!_config.sql) {
		throw new Error(
			'SQL not configured. Call configure({ sql }) before using database functions.'
		);
	}
	return _config.sql;
}

/**
 * Get the configured fetch function, falling back to global fetch.
 * @internal
 */
export function getFetch(): typeof fetch {
	return _config.fetchFn ?? globalThis.fetch;
}

/**
 * Get the configured geo API URL.
 * @internal
 */
export function getGeoApiUrl(): string {
	return _config.geoApiUrl ?? DEFAULT_GEO_API_URL;
}

/**
 * Reset configuration to defaults (for testing).
 * @internal
 */
export function resetConfig(): void {
	_config = {};
}
