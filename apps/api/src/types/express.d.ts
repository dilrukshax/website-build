import { JWTPayload } from '@booking-engine/core';

/**
 * Express Request type augmentations for the buildmyonlineweb API.
 */
declare global {
    namespace Express {
        interface Request {
            /** Resolved tenant context — populated by requireTenant middleware. */
            tenant?: {
                id: string;
                businessName: string;
                status: string;
            };

            /** Resolved instance context — populated by requireInstance middleware. */
            instance?: {
                id: string;
                subdomain: string;
                name: string;
                status: string;
                timezone: string;
            };

            /** JWT auth context — populated by requireAuth middleware. */
            auth?: {
                userId: string;
                tenantId: string;
                role: string;
                permissions: string[];
            };

            /** Raw JWT payload — populated by auth middleware. */
            user?: JWTPayload;

            /** Parsed cookies — populated by cookie-parser middleware. */
            cookies?: Record<string, string>;
        }
    }
}

export {};
