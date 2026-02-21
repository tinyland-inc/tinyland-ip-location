/**
 * User-agent parsing utilities.
 *
 * Pure functions with zero dependencies - parses device type, browser, and OS
 * from user-agent strings.
 *
 * @module user-agent
 */

import type { DeviceInfo } from './types.js';

/**
 * Parse a user-agent string to extract device information.
 *
 * @param userAgent - The user-agent string from the HTTP request
 * @returns Parsed device information including type, browser, and OS
 *
 * @example
 * ```typescript
 * const info = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)');
 * // { deviceType: 'mobile', browser: 'Safari', os: 'iOS' }
 * ```
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
	const ua = userAgent.toLowerCase();

	// Detect device type
	let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
	if (/ipad|tablet|playbook|silk/i.test(ua)) {
		deviceType = 'tablet';
	} else if (
		/iphone|ipod|android.*mobile|windows.*phone|blackberry/i.test(ua)
	) {
		deviceType = 'mobile';
	}

	// Detect browser
	let browser = 'Unknown';
	if (ua.includes('firefox')) browser = 'Firefox';
	else if (ua.includes('chrome')) browser = 'Chrome';
	else if (ua.includes('safari')) browser = 'Safari';
	else if (ua.includes('edge')) browser = 'Edge';
	else if (ua.includes('opera')) browser = 'Opera';

	// Detect OS
	let os = 'Unknown';
	if (ua.includes('windows')) os = 'Windows';
	else if (ua.includes('mac')) os = 'macOS';
	else if (ua.includes('linux')) os = 'Linux';
	else if (ua.includes('android')) os = 'Android';
	else if (
		ua.includes('ios') ||
		ua.includes('iphone') ||
		ua.includes('ipad')
	) {
		os = 'iOS';
	}

	return { deviceType, browser, os };
}
