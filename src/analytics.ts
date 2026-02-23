








import type { VisitorAnalytics } from './types.js';
import { getSql } from './config.js';
import { parseUserAgent } from './user-agent.js';
import { getIPLocation } from './geolocation.js';


















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
		
		if (
			error instanceof Error &&
			error.message.includes('SQL not configured')
		) {
			throw error;
		}
		console.error('Failed to track visitor:', error);
	}
}

















export async function getVisitorAnalytics(
	timeframe: '24h' | '7d' | '30d' = '24h'
): Promise<VisitorAnalytics> {
	const sql = getSql();

	const interval = {
		'24h': '1 day',
		'7d': '7 days',
		'30d': '30 days',
	}[timeframe];

	
	const visitorStats = await sql`
		SELECT
			COUNT(*) as total_visitors,
			COUNT(DISTINCT ip_address) as unique_visitors
		FROM visitor_analytics
		WHERE visited_at > NOW() - INTERVAL ${interval}
	`;

	
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
