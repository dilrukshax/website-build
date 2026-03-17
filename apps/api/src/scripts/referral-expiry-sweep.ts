import path from 'path';
import dotenv from 'dotenv';
import { db } from '@booking-engine/database';
import { logger } from '@booking-engine/core';
import { ReferralRewardsService } from '../services/referral-rewards.service';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
}

async function main(): Promise<void> {
    const result = await ReferralRewardsService.sweepExpiredPoints();
    logger.info('Referral points expiry sweep completed', result);
    process.stdout.write(JSON.stringify({
        success: true,
        data: result,
    }) + '\n');
}

main()
    .catch((error) => {
        logger.error('Referral points expiry sweep failed', { error });
        process.stderr.write(JSON.stringify({
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        }) + '\n');
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.$disconnect();
    });

