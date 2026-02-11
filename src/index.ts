/**
 * @tinyland-inc/tinyland-ip-location
 *
 * IP geolocation, user-agent parsing, and visitor analytics.
 *
 * @example
 * ```typescript
 * import {
 *   configure,
 *   parseUserAgent,
 *   getIPLocation,
 *   trackVisitor,
 *   getVisitorAnalytics,
 * } from '@tinyland-inc/tinyland-ip-location';
 *
 * // Configure with database SQL function
 * configure({ sql: neonSql });
 *
 * // Parse user-agent (no config needed)
 * const device = parseUserAgent(request.headers['user-agent']);
 *
 * // Get IP location (no config needed, uses fetch)
 * const location = await getIPLocation('8.8.8.8');
 *
 * // Track visitor (requires sql config)
 * await trackVisitor('8.8.8.8', '/about', null, 'Mozilla/5.0 ...');
 *
 * // Get analytics (requires sql config)
 * const stats = await getVisitorAnalytics('7d');
 * ```
 *
 * @module index
 */

// Types
export type {
	IPLocationData,
	DeviceInfo,
	VisitorAnalytics,
	SqlTaggedTemplate,
	IpLocationConfig,
} from './types.js';

// Configuration
export { configure, getConfig, resetConfig } from './config.js';

// User-agent parsing
export { parseUserAgent } from './user-agent.js';

// IP geolocation
export { getIPLocation, isPrivateIP } from './geolocation.js';

// Visitor analytics
export { trackVisitor, getVisitorAnalytics } from './analytics.js';
