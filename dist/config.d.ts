import type { IpLocationConfig } from './types.js';
export declare function configure(options: IpLocationConfig): void;
export declare function getConfig(): IpLocationConfig;
export declare function getSql(): NonNullable<IpLocationConfig['sql']>;
export declare function getFetch(): typeof fetch;
export declare function getGeoApiUrl(): string;
export declare function resetConfig(): void;
//# sourceMappingURL=config.d.ts.map