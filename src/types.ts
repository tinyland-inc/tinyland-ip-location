/**
 * Types for @tinyland-inc/tinyland-ip-location
 *
 * @module types
 */

/** IP geolocation data returned from lookup services */
export interface IPLocationData {
	country?: string;
	region?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	timezone?: string;
}

/** Parsed device information from user-agent strings */
export interface DeviceInfo {
	deviceType: 'desktop' | 'mobile' | 'tablet';
	browser: string;
	os: string;
}

/** Aggregated visitor analytics data */
export interface VisitorAnalytics {
	totalVisitors: number;
	uniqueVisitors: number;
	pageViews: Array<{ path: string; count: number }>;
	deviceTypes: Array<{ type: string; count: number }>;
	topReferrers: Array<{ referrer: string; count: number }>;
	recentVisitors: Array<{
		ip: string;
		path: string;
		device: string;
		country: string;
		city: string;
		visited_at: string;
	}>;
	locationStats: Array<{ country: string; count: number }>;
}

/**
 * Tagged template SQL function type.
 * Matches the postgres/neon sql`` tagged template pattern.
 */
export type SqlTaggedTemplate = (
	strings: TemplateStringsArray,
	...values: unknown[]
) => Promise<Record<string, unknown>[]>;

/** Dependency injection configuration for ip-location package */
export interface IpLocationConfig {
	/** Tagged template SQL function for database queries */
	sql?: SqlTaggedTemplate;
	/** IP geolocation API URL template (default: ip-api.com) */
	geoApiUrl?: string;
	/** Custom fetch function (for testing) */
	fetchFn?: typeof fetch;
}
