






export interface IPLocationData {
	country?: string;
	region?: string;
	city?: string;
	latitude?: number;
	longitude?: number;
	timezone?: string;
}


export interface DeviceInfo {
	deviceType: 'desktop' | 'mobile' | 'tablet';
	browser: string;
	os: string;
}


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





export type SqlTaggedTemplate = (
	strings: TemplateStringsArray,
	...values: unknown[]
) => Promise<Record<string, unknown>[]>;


export interface IpLocationConfig {
	
	sql?: SqlTaggedTemplate;
	
	geoApiUrl?: string;
	
	fetchFn?: typeof fetch;
}
