/**
 * IP geolocation lookup utilities.
 *
 * Resolves IP addresses to geographic location data using configurable
 * API endpoints. Handles localhost/private IPs gracefully.
 *
 * @module geolocation
 */

import type { IPLocationData } from './types.js';
import { getFetch, getGeoApiUrl } from './config.js';

/**
 * Check if an IP address is a private/local address.
 *
 * @param ip - The IP address to check
 * @returns True if the IP is localhost or a private range
 */
export function isPrivateIP(ip: string): boolean {
	return (
		ip === '127.0.0.1' ||
		ip === '::1' ||
		ip.startsWith('192.168.') ||
		ip.startsWith('10.') ||
		ip.startsWith('172.16.') ||
		ip.startsWith('172.17.') ||
		ip.startsWith('172.18.') ||
		ip.startsWith('172.19.') ||
		ip.startsWith('172.2') ||
		ip.startsWith('172.30.') ||
		ip.startsWith('172.31.') ||
		ip === '::ffff:127.0.0.1' ||
		ip === '0.0.0.0'
	);
}

/**
 * Get geolocation data for an IP address.
 *
 * For localhost and private IP ranges, returns a "Local" placeholder.
 * For public IPs, queries the configured geo API (default: ip-api.com).
 *
 * @param ip - The IP address to look up
 * @returns Location data or an empty object on failure
 *
 * @example
 * ```typescript
 * const location = await getIPLocation('8.8.8.8');
 * // { country: 'United States', region: 'California', city: 'Mountain View', ... }
 * ```
 */
export async function getIPLocation(ip: string): Promise<IPLocationData> {
	// Skip for localhost/private IPs
	if (
		ip === '127.0.0.1' ||
		ip === '::1' ||
		ip.startsWith('192.168.') ||
		ip.startsWith('10.')
	) {
		return {
			country: 'Local',
			region: 'Local',
			city: 'Local',
			latitude: 0,
			longitude: 0,
			timezone: 'Local',
		};
	}

	try {
		const fetchFn = getFetch();
		const apiUrl = getGeoApiUrl();
		const response = await fetchFn(
			`${apiUrl}/${ip}?fields=status,country,regionName,city,lat,lon,timezone`
		);
		const data = (await response.json()) as Record<string, unknown>;

		if (data.status === 'success') {
			return {
				country: data.country as string | undefined,
				region: data.regionName as string | undefined,
				city: data.city as string | undefined,
				latitude: data.lat as number | undefined,
				longitude: data.lon as number | undefined,
				timezone: data.timezone as string | undefined,
			};
		}
	} catch (error) {
		console.error('Failed to get IP location:', error);
	}

	return {};
}
