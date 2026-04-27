import { getFetch, getGeoApiUrl } from './config.js';
export function isPrivateIP(ip) {
    return (ip === '127.0.0.1' ||
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
        ip === '0.0.0.0');
}
export async function getIPLocation(ip) {
    if (ip === '127.0.0.1' ||
        ip === '::1' ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.')) {
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
        const response = await fetchFn(`${apiUrl}/${ip}?fields=status,country,regionName,city,lat,lon,timezone`);
        const data = (await response.json());
        if (data.status === 'success') {
            return {
                country: data.country,
                region: data.regionName,
                city: data.city,
                latitude: data.lat,
                longitude: data.lon,
                timezone: data.timezone,
            };
        }
    }
    catch (error) {
        console.error('Failed to get IP location:', error);
    }
    return {};
}
