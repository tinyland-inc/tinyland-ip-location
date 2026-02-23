








import type { DeviceInfo } from './types.js';













export function parseUserAgent(userAgent: string): DeviceInfo {
	const ua = userAgent.toLowerCase();

	
	let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
	if (/ipad|tablet|playbook|silk/i.test(ua)) {
		deviceType = 'tablet';
	} else if (
		/iphone|ipod|android.*mobile|windows.*phone|blackberry/i.test(ua)
	) {
		deviceType = 'mobile';
	}

	
	let browser = 'Unknown';
	if (ua.includes('firefox')) browser = 'Firefox';
	else if (ua.includes('chrome')) browser = 'Chrome';
	else if (ua.includes('safari')) browser = 'Safari';
	else if (ua.includes('edge')) browser = 'Edge';
	else if (ua.includes('opera')) browser = 'Opera';

	
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
