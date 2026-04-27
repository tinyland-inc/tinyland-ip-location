import type { VisitorAnalytics } from './types.js';
export declare function trackVisitor(ip: string, path: string, referrer: string | null, userAgent: string | null): Promise<void>;
export declare function getVisitorAnalytics(timeframe?: '24h' | '7d' | '30d'): Promise<VisitorAnalytics>;
//# sourceMappingURL=analytics.d.ts.map