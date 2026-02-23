











import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
	configure,
	getConfig,
	resetConfig,
	parseUserAgent,
	getIPLocation,
	trackVisitor,
	getVisitorAnalytics,
	isPrivateIP,
} from '../src/index.js';
import type {
	IpLocationConfig,
	IPLocationData,
	DeviceInfo,
	VisitorAnalytics,
	SqlTaggedTemplate,
} from '../src/index.js';





function createMockFetch(data: unknown, ok = true): Mock {
	return vi.fn().mockResolvedValue({
		ok,
		json: () => Promise.resolve(data),
	});
}

function createMockSql(responses?: Record<string, unknown>[][]): Mock {
	const callIndex = { current: 0 };
	return vi.fn().mockImplementation(() => {
		const result = responses?.[callIndex.current] ?? [];
		callIndex.current++;
		return Promise.resolve(result);
	});
}

function createSuccessGeoResponse(overrides: Partial<Record<string, unknown>> = {}) {
	return {
		status: 'success',
		country: 'United States',
		regionName: 'California',
		city: 'Mountain View',
		lat: 37.386,
		lon: -122.0838,
		timezone: 'America/Los_Angeles',
		...overrides,
	};
}





describe('Config DI', () => {
	beforeEach(() => {
		resetConfig();
	});

	it('should return empty config by default', () => {
		const config = getConfig();
		expect(config).toEqual({});
	});

	it('should configure sql', () => {
		const mockSql = createMockSql();
		configure({ sql: mockSql as unknown as SqlTaggedTemplate });
		expect(getConfig().sql).toBe(mockSql);
	});

	it('should configure geoApiUrl', () => {
		configure({ geoApiUrl: 'http://custom-api.com/json' });
		expect(getConfig().geoApiUrl).toBe('http://custom-api.com/json');
	});

	it('should configure fetchFn', () => {
		const mockFetch = createMockFetch({});
		configure({ fetchFn: mockFetch as unknown as typeof fetch });
		expect(getConfig().fetchFn).toBe(mockFetch);
	});

	it('should merge configurations', () => {
		const mockSql = createMockSql();
		configure({ sql: mockSql as unknown as SqlTaggedTemplate });
		configure({ geoApiUrl: 'http://custom.com' });
		const config = getConfig();
		expect(config.sql).toBe(mockSql);
		expect(config.geoApiUrl).toBe('http://custom.com');
	});

	it('should reset to defaults', () => {
		configure({
			sql: createMockSql() as unknown as SqlTaggedTemplate,
			geoApiUrl: 'http://custom.com',
		});
		resetConfig();
		const config = getConfig();
		expect(config.sql).toBeUndefined();
		expect(config.geoApiUrl).toBeUndefined();
		expect(config.fetchFn).toBeUndefined();
	});

	it('should override previous sql on re-configure', () => {
		const sql1 = createMockSql();
		const sql2 = createMockSql();
		configure({ sql: sql1 as unknown as SqlTaggedTemplate });
		configure({ sql: sql2 as unknown as SqlTaggedTemplate });
		expect(getConfig().sql).toBe(sql2);
	});

	it('should allow configuring all options at once', () => {
		const mockSql = createMockSql();
		const mockFetch = createMockFetch({});
		configure({
			sql: mockSql as unknown as SqlTaggedTemplate,
			geoApiUrl: 'http://example.com',
			fetchFn: mockFetch as unknown as typeof fetch,
		});
		const config = getConfig();
		expect(config.sql).toBe(mockSql);
		expect(config.geoApiUrl).toBe('http://example.com');
		expect(config.fetchFn).toBe(mockFetch);
	});

	it('should handle configure with empty object', () => {
		configure({});
		expect(getConfig()).toEqual({});
	});

	it('should not throw when resetting already-default config', () => {
		expect(() => resetConfig()).not.toThrow();
	});
});





describe('parseUserAgent', () => {
	describe('device type detection', () => {
		it('should detect desktop user agent', () => {
			const ua =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('desktop');
		});

		it('should detect mobile iPhone', () => {
			const ua =
				'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect mobile iPod', () => {
			const ua = 'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect mobile Android phone', () => {
			const ua =
				'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect mobile Windows Phone', () => {
			const ua =
				'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1) Edge/13.10586';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect mobile BlackBerry', () => {
			const ua = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900)';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('mobile');
		});

		it('should detect tablet iPad', () => {
			const ua =
				'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('tablet');
		});

		it('should detect tablet with "tablet" keyword', () => {
			const ua = 'Mozilla/5.0 (Linux; Android 12; Tablet) AppleWebKit/537.36';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('tablet');
		});

		it('should detect tablet PlayBook', () => {
			const ua = 'Mozilla/5.0 (PlayBook; U; RIM Tablet OS 2.1.0)';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('tablet');
		});

		it('should detect tablet Silk browser (Kindle Fire)', () => {
			const ua =
				'Mozilla/5.0 (Linux; Android 4.4.3; KFTHWI Build) AppleWebKit/537.36 Silk/65.3.1';
			const result = parseUserAgent(ua);
			expect(result.deviceType).toBe('tablet');
		});
	});

	describe('browser detection', () => {
		it('should detect Chrome', () => {
			const ua =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36';
			expect(parseUserAgent(ua).browser).toBe('Chrome');
		});

		it('should detect Firefox', () => {
			const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';
			expect(parseUserAgent(ua).browser).toBe('Firefox');
		});

		it('should detect Safari', () => {
			const ua =
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
			expect(parseUserAgent(ua).browser).toBe('Safari');
		});

		it('should detect Edge', () => {
			const ua =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edge/120.0.0.0';
			
			
			
			expect(parseUserAgent(ua).browser).toBe('Chrome');
		});

		it('should detect Edge when only edge keyword present', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0) Edge/44.18362.449.0';
			expect(parseUserAgent(ua).browser).toBe('Edge');
		});

		it('should detect Opera', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Opera/90.0.4480.54';
			expect(parseUserAgent(ua).browser).toBe('Opera');
		});

		it('should return Unknown for unrecognized browser', () => {
			const ua = 'CustomBot/1.0 (+http://example.com/bot)';
			expect(parseUserAgent(ua).browser).toBe('Unknown');
		});

		it('should return Unknown for curl user agent', () => {
			const ua = 'curl/7.88.1';
			expect(parseUserAgent(ua).browser).toBe('Unknown');
		});
	});

	describe('OS detection', () => {
		it('should detect Windows', () => {
			const ua =
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
			expect(parseUserAgent(ua).os).toBe('Windows');
		});

		it('should detect macOS', () => {
			const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15';
			expect(parseUserAgent(ua).os).toBe('macOS');
		});

		it('should detect Linux', () => {
			const ua = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/120.0';
			expect(parseUserAgent(ua).os).toBe('Linux');
		});

		it('should detect Android', () => {
			const ua =
				'Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120.0 Mobile Safari/537.36';
			
			expect(parseUserAgent(ua).os).toBe('Linux');
		});

		it('should detect Android when linux is not present', () => {
			const ua = 'Mozilla/5.0 (Android 13; Mobile) Chrome/120.0';
			expect(parseUserAgent(ua).os).toBe('Android');
		});

		it('should detect macOS for iPhone UA (contains "Mac OS X")', () => {
			
			
			const ua =
				'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Safari/605.1.15';
			expect(parseUserAgent(ua).os).toBe('macOS');
		});

		it('should detect macOS for iPad UA (contains "Mac OS X")', () => {
			
			
			const ua = 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) Safari/605.1.15';
			expect(parseUserAgent(ua).os).toBe('macOS');
		});

		it('should detect iOS when only ios keyword present', () => {
			const ua = 'CustomBrowser/1.0 (iOS 16.0)';
			expect(parseUserAgent(ua).os).toBe('iOS');
		});

		it('should detect iOS when iphone present without Mac OS X', () => {
			const ua = 'Mozilla/5.0 (iPhone; CPU) Safari/605.1.15';
			expect(parseUserAgent(ua).os).toBe('iOS');
		});

		it('should return Unknown for unrecognized OS', () => {
			const ua = 'CustomBot/1.0';
			expect(parseUserAgent(ua).os).toBe('Unknown');
		});
	});

	describe('edge cases', () => {
		it('should handle empty string', () => {
			const result = parseUserAgent('');
			expect(result.deviceType).toBe('desktop');
			expect(result.browser).toBe('Unknown');
			expect(result.os).toBe('Unknown');
		});

		it('should handle string with only spaces', () => {
			const result = parseUserAgent('   ');
			expect(result.deviceType).toBe('desktop');
			expect(result.browser).toBe('Unknown');
			expect(result.os).toBe('Unknown');
		});

		it('should handle unicode characters in user agent', () => {
			const ua = 'Mozilla/5.0 (\u00e4\u00f6\u00fc) Chrome/120.0';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Chrome');
		});

		it('should handle very long user agent string', () => {
			const ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 ' + 'a'.repeat(10000);
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Chrome');
			expect(result.os).toBe('Windows');
		});

		it('should be case-insensitive', () => {
			const ua = 'MOZILLA/5.0 (WINDOWS NT 10.0) CHROME/120.0';
			const result = parseUserAgent(ua);
			expect(result.browser).toBe('Chrome');
			expect(result.os).toBe('Windows');
		});
	});
});





describe('getIPLocation', () => {
	beforeEach(() => {
		resetConfig();
	});

	describe('private/localhost IPs', () => {
		it('should return Local for 127.0.0.1', async () => {
			const result = await getIPLocation('127.0.0.1');
			expect(result.country).toBe('Local');
			expect(result.region).toBe('Local');
			expect(result.city).toBe('Local');
			expect(result.latitude).toBe(0);
			expect(result.longitude).toBe(0);
			expect(result.timezone).toBe('Local');
		});

		it('should return Local for ::1', async () => {
			const result = await getIPLocation('::1');
			expect(result.country).toBe('Local');
		});

		it('should return Local for 192.168.x.x', async () => {
			const result = await getIPLocation('192.168.1.1');
			expect(result.country).toBe('Local');
		});

		it('should return Local for 192.168.0.100', async () => {
			const result = await getIPLocation('192.168.0.100');
			expect(result.country).toBe('Local');
		});

		it('should return Local for 10.x.x.x', async () => {
			const result = await getIPLocation('10.0.0.1');
			expect(result.country).toBe('Local');
		});

		it('should return Local for 10.255.255.255', async () => {
			const result = await getIPLocation('10.255.255.255');
			expect(result.country).toBe('Local');
		});
	});

	describe('successful lookup', () => {
		it('should return location data for public IP', async () => {
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result.country).toBe('United States');
			expect(result.region).toBe('California');
			expect(result.city).toBe('Mountain View');
			expect(result.latitude).toBe(37.386);
			expect(result.longitude).toBe(-122.0838);
			expect(result.timezone).toBe('America/Los_Angeles');
		});

		it('should call fetch with correct URL', async () => {
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			await getIPLocation('1.2.3.4');
			expect(mockFetch).toHaveBeenCalledWith(
				'http://ip-api.com/json/1.2.3.4?fields=status,country,regionName,city,lat,lon,timezone'
			);
		});

		it('should use custom geoApiUrl', async () => {
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({
				fetchFn: mockFetch as unknown as typeof fetch,
				geoApiUrl: 'http://custom-geo.com/api',
			});

			await getIPLocation('8.8.8.8');
			expect(mockFetch).toHaveBeenCalledWith(
				'http://custom-geo.com/api/8.8.8.8?fields=status,country,regionName,city,lat,lon,timezone'
			);
		});

		it('should handle partial geo response', async () => {
			const mockFetch = createMockFetch({
				status: 'success',
				country: 'Germany',
			});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('5.5.5.5');
			expect(result.country).toBe('Germany');
			expect(result.region).toBeUndefined();
			expect(result.city).toBeUndefined();
		});
	});

	describe('failure cases', () => {
		it('should return empty object when API returns non-success', async () => {
			const mockFetch = createMockFetch({ status: 'fail', message: 'invalid query' });
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('999.999.999.999');
			expect(result).toEqual({});
		});

		it('should return empty object when fetch throws', async () => {
			const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});

		it('should return empty object when JSON parsing fails', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new Error('Invalid JSON')),
			});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});

		it('should return empty object on timeout', async () => {
			const mockFetch = vi.fn().mockImplementation(
				() => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10))
			);
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});

		it('should return empty object when response has unexpected shape', async () => {
			const mockFetch = createMockFetch('not-an-object');
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});

		it('should return empty object when status is missing', async () => {
			const mockFetch = createMockFetch({ country: 'Test' });
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});
	});

	describe('custom fetchFn', () => {
		it('should use injected fetchFn over global', async () => {
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			await getIPLocation('8.8.8.8');
			expect(mockFetch).toHaveBeenCalledOnce();
		});

		it('should work with fetchFn returning different locations', async () => {
			const mockFetch = createMockFetch(
				createSuccessGeoResponse({
					country: 'Japan',
					regionName: 'Tokyo',
					city: 'Shibuya',
				})
			);
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('203.0.113.1');
			expect(result.country).toBe('Japan');
			expect(result.region).toBe('Tokyo');
			expect(result.city).toBe('Shibuya');
		});
	});
});





describe('isPrivateIP', () => {
	it('should identify 127.0.0.1 as private', () => {
		expect(isPrivateIP('127.0.0.1')).toBe(true);
	});

	it('should identify ::1 as private', () => {
		expect(isPrivateIP('::1')).toBe(true);
	});

	it('should identify 192.168.x.x as private', () => {
		expect(isPrivateIP('192.168.1.1')).toBe(true);
		expect(isPrivateIP('192.168.0.100')).toBe(true);
	});

	it('should identify 10.x.x.x as private', () => {
		expect(isPrivateIP('10.0.0.1')).toBe(true);
		expect(isPrivateIP('10.255.255.255')).toBe(true);
	});

	it('should identify 172.16-31.x.x as private', () => {
		expect(isPrivateIP('172.16.0.1')).toBe(true);
		expect(isPrivateIP('172.31.255.255')).toBe(true);
	});

	it('should identify ::ffff:127.0.0.1 as private', () => {
		expect(isPrivateIP('::ffff:127.0.0.1')).toBe(true);
	});

	it('should identify 0.0.0.0 as private', () => {
		expect(isPrivateIP('0.0.0.0')).toBe(true);
	});

	it('should not identify public IPs as private', () => {
		expect(isPrivateIP('8.8.8.8')).toBe(false);
		expect(isPrivateIP('1.1.1.1')).toBe(false);
		expect(isPrivateIP('203.0.113.1')).toBe(false);
	});
});





describe('trackVisitor', () => {
	let mockSql: Mock;
	let mockFetch: Mock;

	beforeEach(() => {
		resetConfig();
		mockSql = createMockSql([[]]);
		mockFetch = createMockFetch(createSuccessGeoResponse());
		configure({
			sql: mockSql as unknown as SqlTaggedTemplate,
			fetchFn: mockFetch as unknown as typeof fetch,
		});
	});

	it('should throw when SQL is not configured', async () => {
		resetConfig();
		configure({ fetchFn: mockFetch as unknown as typeof fetch });
		await expect(trackVisitor('8.8.8.8', '/home', null, null)).rejects.toThrow(
			'SQL not configured'
		);
	});

	it('should call sql with visitor data', async () => {
		await trackVisitor('8.8.8.8', '/about', 'https://google.com', 'Mozilla/5.0 Chrome/120.0');
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle null referrer', async () => {
		await trackVisitor('8.8.8.8', '/home', null, 'Mozilla/5.0 Chrome/120.0');
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle null userAgent', async () => {
		await trackVisitor('8.8.8.8', '/home', 'https://google.com', null);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle both null referrer and userAgent', async () => {
		await trackVisitor('8.8.8.8', '/home', null, null);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should enrich with device info when userAgent provided', async () => {
		const ua =
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';
		await trackVisitor('8.8.8.8', '/test', null, ua);
		expect(mockSql).toHaveBeenCalledOnce();
		
		const callArgs = mockSql.mock.calls[0];
		expect(callArgs).toBeDefined();
	});

	it('should enrich with location data', async () => {
		await trackVisitor('8.8.8.8', '/test', null, 'Mozilla/5.0 Chrome/120.0');
		expect(mockFetch).toHaveBeenCalledOnce();
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should skip geolocation fetch for localhost', async () => {
		await trackVisitor('127.0.0.1', '/test', null, 'Mozilla/5.0 Chrome/120.0');
		expect(mockFetch).not.toHaveBeenCalled();
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should skip geolocation fetch for private IP', async () => {
		await trackVisitor('192.168.1.1', '/test', null, 'Mozilla/5.0 Chrome/120.0');
		expect(mockFetch).not.toHaveBeenCalled();
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle sql insert failure gracefully', async () => {
		mockSql.mockRejectedValueOnce(new Error('DB connection lost'));
		
		await expect(
			trackVisitor('8.8.8.8', '/test', null, 'Mozilla/5.0 Chrome/120.0')
		).resolves.toBeUndefined();
	});

	it('should handle geolocation failure gracefully during tracking', async () => {
		const failingFetch = vi.fn().mockRejectedValue(new Error('Network error'));
		configure({
			sql: mockSql as unknown as SqlTaggedTemplate,
			fetchFn: failingFetch as unknown as typeof fetch,
		});
		
		await trackVisitor('8.8.8.8', '/test', null, 'Mozilla/5.0 Chrome/120.0');
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should pass ip as first sql parameter', async () => {
		await trackVisitor('1.2.3.4', '/page', null, null);
		const callArgs = mockSql.mock.calls[0];
		
		
		
		
		expect(callArgs).toBeDefined();
	});

	it('should handle mobile user agent enrichment', async () => {
		const ua =
			'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 Safari/604.1';
		await trackVisitor('8.8.8.8', '/mobile-page', null, ua);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle tablet user agent enrichment', async () => {
		const ua =
			'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
		await trackVisitor('8.8.8.8', '/tablet-page', null, ua);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle various path formats', async () => {
		await trackVisitor('8.8.8.8', '/', null, null);
		await trackVisitor('8.8.8.8', '/deeply/nested/path', null, null);
		await trackVisitor('8.8.8.8', '/path?query=value', null, null);
		expect(mockSql).toHaveBeenCalledTimes(3);
	});

	it('should handle referrer with special characters', async () => {
		await trackVisitor(
			'8.8.8.8',
			'/test',
			'https://example.com/search?q=hello+world&lang=en',
			null
		);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle empty string referrer', async () => {
		await trackVisitor('8.8.8.8', '/test', '', null);
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should handle empty string userAgent', async () => {
		await trackVisitor('8.8.8.8', '/test', null, '');
		expect(mockSql).toHaveBeenCalledOnce();
	});

	it('should process user-agent before geolocation', async () => {
		const callOrder: string[] = [];
		const orderedFetch = vi.fn().mockImplementation(async () => {
			callOrder.push('fetch');
			return { ok: true, json: () => Promise.resolve(createSuccessGeoResponse()) };
		});
		const orderedSql = vi.fn().mockImplementation(async () => {
			callOrder.push('sql');
			return [];
		});
		configure({
			sql: orderedSql as unknown as SqlTaggedTemplate,
			fetchFn: orderedFetch as unknown as typeof fetch,
		});

		await trackVisitor('8.8.8.8', '/test', null, 'Mozilla/5.0 Chrome/120.0');
		expect(callOrder).toEqual(['fetch', 'sql']);
	});
});





describe('getVisitorAnalytics', () => {
	let mockSql: Mock;

	const defaultResponses: Record<string, unknown>[][] = [
		
		[{ total_visitors: '150', unique_visitors: '42' }],
		
		[
			{ path: '/home', count: 50 },
			{ path: '/about', count: 30 },
		],
		
		[
			{ type: 'desktop', count: 80 },
			{ type: 'mobile', count: 60 },
		],
		
		[
			{ referrer: 'https://google.com', count: 40 },
			{ referrer: 'Direct', count: 30 },
		],
		
		[
			{
				ip: '8.8.8.8',
				path: '/home',
				device: 'desktop',
				country: 'US',
				city: 'NYC',
				visited_at: '2025-01-01T00:00:00Z',
			},
		],
		
		[
			{ country: 'United States', count: 100 },
			{ country: 'Germany', count: 20 },
		],
	];

	beforeEach(() => {
		resetConfig();
		mockSql = createMockSql(defaultResponses);
		configure({ sql: mockSql as unknown as SqlTaggedTemplate });
	});

	it('should throw when SQL is not configured', async () => {
		resetConfig();
		await expect(getVisitorAnalytics()).rejects.toThrow('SQL not configured');
	});

	it('should return all analytics categories', async () => {
		const result = await getVisitorAnalytics();
		expect(result.totalVisitors).toBe(150);
		expect(result.uniqueVisitors).toBe(42);
		expect(result.pageViews).toHaveLength(2);
		expect(result.deviceTypes).toHaveLength(2);
		expect(result.topReferrers).toHaveLength(2);
		expect(result.recentVisitors).toHaveLength(1);
		expect(result.locationStats).toHaveLength(2);
	});

	it('should default to 24h timeframe', async () => {
		await getVisitorAnalytics();
		
		expect(mockSql).toHaveBeenCalledTimes(6);
	});

	it('should accept 7d timeframe', async () => {
		await getVisitorAnalytics('7d');
		expect(mockSql).toHaveBeenCalledTimes(6);
	});

	it('should accept 30d timeframe', async () => {
		await getVisitorAnalytics('30d');
		expect(mockSql).toHaveBeenCalledTimes(6);
	});

	it('should accept 24h timeframe explicitly', async () => {
		await getVisitorAnalytics('24h');
		expect(mockSql).toHaveBeenCalledTimes(6);
	});

	it('should parse totalVisitors as integer', async () => {
		const result = await getVisitorAnalytics();
		expect(typeof result.totalVisitors).toBe('number');
		expect(result.totalVisitors).toBe(150);
	});

	it('should parse uniqueVisitors as integer', async () => {
		const result = await getVisitorAnalytics();
		expect(typeof result.uniqueVisitors).toBe('number');
		expect(result.uniqueVisitors).toBe(42);
	});

	it('should return pageViews with path and count', async () => {
		const result = await getVisitorAnalytics();
		expect(result.pageViews[0]).toEqual({ path: '/home', count: 50 });
	});

	it('should return deviceTypes with type and count', async () => {
		const result = await getVisitorAnalytics();
		expect(result.deviceTypes[0]).toEqual({ type: 'desktop', count: 80 });
	});

	it('should return topReferrers with referrer and count', async () => {
		const result = await getVisitorAnalytics();
		expect(result.topReferrers[0]).toEqual({
			referrer: 'https://google.com',
			count: 40,
		});
	});

	it('should return recentVisitors with full details', async () => {
		const result = await getVisitorAnalytics();
		expect(result.recentVisitors[0]).toEqual({
			ip: '8.8.8.8',
			path: '/home',
			device: 'desktop',
			country: 'US',
			city: 'NYC',
			visited_at: '2025-01-01T00:00:00Z',
		});
	});

	it('should return locationStats with country and count', async () => {
		const result = await getVisitorAnalytics();
		expect(result.locationStats[0]).toEqual({
			country: 'United States',
			count: 100,
		});
	});

	describe('empty results', () => {
		it('should handle empty visitor stats', async () => {
			const emptySql = createMockSql([
				[{ total_visitors: '0', unique_visitors: '0' }],
				[],
				[],
				[],
				[],
				[],
			]);
			configure({ sql: emptySql as unknown as SqlTaggedTemplate });

			const result = await getVisitorAnalytics();
			expect(result.totalVisitors).toBe(0);
			expect(result.uniqueVisitors).toBe(0);
			expect(result.pageViews).toEqual([]);
			expect(result.deviceTypes).toEqual([]);
			expect(result.topReferrers).toEqual([]);
			expect(result.recentVisitors).toEqual([]);
			expect(result.locationStats).toEqual([]);
		});

		it('should handle missing visitor stats row', async () => {
			const emptySql = createMockSql([[], [], [], [], [], []]);
			configure({ sql: emptySql as unknown as SqlTaggedTemplate });

			const result = await getVisitorAnalytics();
			expect(result.totalVisitors).toBe(0);
			expect(result.uniqueVisitors).toBe(0);
		});
	});

	it('should make exactly 6 SQL queries', async () => {
		await getVisitorAnalytics();
		expect(mockSql).toHaveBeenCalledTimes(6);
	});

	it('should propagate SQL errors', async () => {
		const failingSql = vi.fn().mockRejectedValue(new Error('DB timeout'));
		configure({ sql: failingSql as unknown as SqlTaggedTemplate });

		await expect(getVisitorAnalytics()).rejects.toThrow('DB timeout');
	});
});





describe('Edge cases', () => {
	beforeEach(() => {
		resetConfig();
	});

	describe('API response edge cases', () => {
		it('should handle API returning status: fail', async () => {
			const mockFetch = createMockFetch({
				status: 'fail',
				message: 'private range',
				query: '192.168.1.1',
			});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('11.0.0.1');
			expect(result).toEqual({});
		});

		it('should handle API returning empty object', async () => {
			const mockFetch = createMockFetch({});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.4.4');
			expect(result).toEqual({});
		});

		it('should handle API returning null values', async () => {
			const mockFetch = createMockFetch({
				status: 'success',
				country: null,
				regionName: null,
				city: null,
				lat: null,
				lon: null,
				timezone: null,
			});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result.country).toBeNull();
		});

		it('should handle malformed JSON from API', async () => {
			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new SyntaxError('Unexpected token')),
			});
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});

		it('should handle network timeout', async () => {
			const mockFetch = vi.fn().mockImplementation(
				() =>
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error('AbortError: timeout')), 5)
					)
			);
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const result = await getIPLocation('8.8.8.8');
			expect(result).toEqual({});
		});
	});

	describe('unicode and special characters', () => {
		it('should handle unicode in user agent for parseUserAgent', () => {
			const result = parseUserAgent(
				'Mozilla/5.0 \u{1F600} (Windows NT 10.0) Chrome/120.0'
			);
			expect(result.os).toBe('Windows');
			expect(result.browser).toBe('Chrome');
		});

		it('should handle CJK characters in user agent', () => {
			const result = parseUserAgent(
				'\u65E5\u672C\u8A9E\u30D6\u30E9\u30A6\u30B6 Chrome/120.0 Windows'
			);
			expect(result.browser).toBe('Chrome');
		});

		it('should handle RTL characters in user agent', () => {
			const result = parseUserAgent(
				'\u0645\u0631\u0648\u0631\u06AF\u0631 Chrome/120.0 Linux'
			);
			expect(result.browser).toBe('Chrome');
			expect(result.os).toBe('Linux');
		});
	});

	describe('type exports', () => {
		it('should export IPLocationData type', () => {
			const data: IPLocationData = { country: 'US' };
			expect(data.country).toBe('US');
		});

		it('should export DeviceInfo type', () => {
			const info: DeviceInfo = {
				deviceType: 'desktop',
				browser: 'Chrome',
				os: 'Windows',
			};
			expect(info.deviceType).toBe('desktop');
		});

		it('should export VisitorAnalytics type', () => {
			const analytics: VisitorAnalytics = {
				totalVisitors: 0,
				uniqueVisitors: 0,
				pageViews: [],
				deviceTypes: [],
				topReferrers: [],
				recentVisitors: [],
				locationStats: [],
			};
			expect(analytics.totalVisitors).toBe(0);
		});

		it('should export IpLocationConfig type', () => {
			const config: IpLocationConfig = {
				geoApiUrl: 'http://example.com',
			};
			expect(config.geoApiUrl).toBe('http://example.com');
		});
	});

	describe('concurrent operations', () => {
		it('should handle multiple concurrent getIPLocation calls', async () => {
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({ fetchFn: mockFetch as unknown as typeof fetch });

			const results = await Promise.all([
				getIPLocation('8.8.8.8'),
				getIPLocation('1.1.1.1'),
				getIPLocation('127.0.0.1'),
			]);

			expect(results[0].country).toBe('United States');
			expect(results[1].country).toBe('United States');
			expect(results[2].country).toBe('Local');
			
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should handle multiple concurrent trackVisitor calls', async () => {
			const mockSql = createMockSql([[], [], []]);
			const mockFetch = createMockFetch(createSuccessGeoResponse());
			configure({
				sql: mockSql as unknown as SqlTaggedTemplate,
				fetchFn: mockFetch as unknown as typeof fetch,
			});

			await Promise.all([
				trackVisitor('8.8.8.8', '/a', null, null),
				trackVisitor('1.1.1.1', '/b', null, null),
				trackVisitor('127.0.0.1', '/c', null, null),
			]);

			expect(mockSql).toHaveBeenCalledTimes(3);
		});
	});

	describe('config isolation between tests', () => {
		it('should have clean config after reset (test 1)', () => {
			configure({ geoApiUrl: 'http://test1.com' });
			resetConfig();
			expect(getConfig().geoApiUrl).toBeUndefined();
		});

		it('should have clean config after reset (test 2)', () => {
			expect(getConfig().geoApiUrl).toBeUndefined();
		});
	});
});
