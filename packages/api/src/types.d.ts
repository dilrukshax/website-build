import { JWTPayload } from '@booking-engine/core';

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
            tenant?: {
                id: string;
                businessName: string;
                status: string;
            };
            instance?: {
                id: string;
                subdomain: string;
            };
        }
    }
}
