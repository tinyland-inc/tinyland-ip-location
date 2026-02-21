/**
 * Visitor analytics tracking and reporting.
 *
 * Requires a SQL tagged template function to be configured via DI.
 * Uses the `sql` tagged template for all database operations.
 *
 * @module analytics
 */

import type { VisitorAnalytics } from './types.js';
import { getSql } from './config.js';
import { parseUserAgent } from './user-agent.js';
import { getIPLocation } from './geolocation.js';

/**
 * Track a visitor by inserting analytics data into the database.
 *
 * Automatically enriches the record with device info (from user-agent parsing)
 * and geolocation data (from IP lookup).
 *
 * @param ip - Visitor IP address
 * @param path - URL path visited
 * @param referrer - HTTP referrer (null if direct)
 * @param userAgent - User-agent string (null if unavailable)
 * @throws {Error} If SQL is not configured
 *
 * @example
 * ```typescript
 * await trackVisitor('8.8.8.8', '/about', 'https://google.com', 'Mozilla/5.0 ...');
 * ```
 */
export async function trackVisitor(
	ip: string,
	path: string,
	referrer: string | null,
	userAgent: string | null
): Promise<void> {
	const sql = getSql();

	try {
		const deviceInfo = userAgent ? parseUserAgent(userAgent) : null;
		const location = await getIPLocation(ip);

		await sql`
			INSERT INTO visitor_analytics (
				ip_address,
				path,
				referrer,
				user_agent,
				device_type,
				browser,
				os,
				country,
				region,
				city,
				latitude,
				longitude,
				timezone
			) VALUES (
				${ip}::inet,
				${path},
				${referrer},
				${userAgent},
				${deviceInfo?.deviceType || null},
				${deviceInfo?.browser || null},
				${deviceInfo?.os || null},
				${location.country || null},
				${location.region || null},
				${location.city || null},
				${location.latitude || null},
				${location.longitude || null},
				${location.timezone || null}
			)
		`;
	} catch (error) {
		// Re-throw SQL not configured errors
		if (
			error instanceof Error &&
			error.message.includes('SQL not configured')
		) {
			throw error;
		}
		console.error('Failed to track visitor:', error);
	}
}

/**
 * Get aggregated visitor analytics for a given timeframe.
 *
 * Returns total/unique visitors, page views, device types, referrers,
 * recent visitors, and location statistics.
 *
 * @param timeframe - Time window: '24h', '7d', or '30d' (default: '24h')
 * @returns Aggregated analytics data
 * @throws {Error} If SQL is not configured
 *
 * @example
 * ```typescript
 * const stats = await getVisitorAnalytics('7d');
 * console.log(`${stats.uniqueVisitors} unique visitors in the last 7 days`);
 * ```
 */
export async function getVisitorAnalytics(
	timeframe: '24h' | '7d' | '30d' = '24h'
): Promise<VisitorAnalytics> {
	const sql = getSql();

	const interval = {
		'24h': '1 day',
		'7d': '7 days',
		'30d': '30 days',
	}[timeframe];

	// Get total and unique visitors
	const visitorStats = await sql`
		SELECT
			COUNT(*) as total_visitors,
			COUNT(DISTINCT ip_address) as unique_visitors
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
	`;

	// Get page views
	const pageViews = await sql`
		SELECT
			path,
			COUNT(*) as count
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
		GROUP BY path
		ORDER BY count DESC
		LIMIT 10
	`;

	// Get device types
	const deviceTypes = await sql`
		SELECT
			device_type as type,
			COUNT(*) as count
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
			AND device_type IS NOT NULL
		GROUP BY device_type
		ORDER BY count DESC
	`;

	// Get top referrers
	const topReferrers = await sql`
		SELECT
			COALESCE(referrer, 'Direct') as referrer,
			COUNT(*) as count
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
		GROUP BY referrer
		ORDER BY count DESC
		LIMIT 10
	`;

	// Get recent visitors with location
	const recentVisitors = await sql`
		SELECT
			ip_address as ip,
			path,
			device_type as device,
			country,
			city,
			visited_at
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
		ORDER BY visited_at DESC
		LIMIT 20
	`;

	// Get location stats
	const locationStats = await sql`
		SELECT
			country,
			COUNT(*) as count
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
			AND country IS NOT NULL
		GROUP BY country
		ORDER BY count DESC
		LIMIT 10
	`;

	return {
		totalVisitors: parseInt(
			String(visitorStats[0]?.total_visitors ?? '0')
		),
		uniqueVisitors: parseInt(
			String(visitorStats[0]?.unique_visitors ?? '0')
		),
		pageViews: pageViews as unknown as VisitorAnalytics['pageViews'],
		deviceTypes: deviceTypes as unknown as VisitorAnalytics['deviceTypes'],
		topReferrers:
			topReferrers as unknown as VisitorAnalytics['topReferrers'],
		recentVisitors:
			recentVisitors as unknown as VisitorAnalytics['recentVisitors'],
		locationStats:
			locationStats as unknown as VisitorAnalytics['locationStats'],
	};
}
