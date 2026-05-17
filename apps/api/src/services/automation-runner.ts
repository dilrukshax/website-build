/**
 * Automation runner (design §14). DB-backed task queue + single interval
 * worker (no Redis in this infra). Env-guarded so tests/CI stay quiet.
 *
 * v1 is a safe skeleton: it claims due tasks with row-locking semantics,
 * runs the registered handler, applies exponential backoff, and dead-letters
 * after maxAttempts. Concrete handlers (AliExpress availability/tracking,
 * payment reconcile, customer notify, post-approval supplier placement) are
 * Phase-2 — registered here as logged no-ops so enqueuing is already safe.
 */
import { db, Prisma } from '@booking-engine/database';
import { logger } from '@booking-engine/core';

type TaskHandler = (payload: Record<string, unknown>) => Promise<void>;

const HANDLERS: Record<string, TaskHandler> = {
    'aliexpress.token.refresh': async (p) => {
        logger.info('automation: aliexpress.token.refresh (phase-2 stub)', { p });
    },
    'availability.sync': async (p) => {
        logger.info('automation: availability.sync (phase-2 stub)', { p });
    },
    'tracking.poll': async (p) => {
        logger.info('automation: tracking.poll (phase-2 stub)', { p });
    },
    'payment.reconcile': async (p) => {
        logger.info('automation: payment.reconcile (phase-2 stub)', { p });
    },
    'notify.customer': async (p) => {
        logger.info('automation: notify.customer (phase-2 stub)', { p });
    },
    'supplier.place_order': async (p) => {
        // Enqueued only AFTER the owner-approval gate (design §12).
        logger.info('automation: supplier.place_order (phase-2 stub)', { p });
    },
};

const POLL_INTERVAL_MS = Number(process.env.AUTOMATION_POLL_INTERVAL_MS || 15000);
let timer: NodeJS.Timeout | null = null;
let running = false;

export async function enqueueTask(input: {
    type: keyof typeof HANDLERS | string;
    payload: Record<string, unknown>;
    tenantId?: string | null;
    instanceId?: string | null;
    runAt?: Date;
    maxAttempts?: number;
}): Promise<void> {
    await db.automationTask.create({
        data: {
            type: input.type,
            payloadJsonb: input.payload as Prisma.InputJsonValue,
            tenantId: input.tenantId ?? null,
            instanceId: input.instanceId ?? null,
            runAt: input.runAt ?? new Date(),
            maxAttempts: input.maxAttempts ?? 5,
        },
    });
}

async function processDueTasks(): Promise<void> {
    if (running) return;
    running = true;
    try {
        const now = new Date();
        const due = await db.automationTask.findMany({
            where: { status: 'queued', runAt: { lte: now } },
            orderBy: { runAt: 'asc' },
            take: 10,
        });

        for (const task of due) {
            // Optimistic claim: only proceed if still queued.
            const claimed = await db.automationTask.updateMany({
                where: { id: task.id, status: 'queued' },
                data: { status: 'running', lockedAt: new Date() },
            });
            if (claimed.count === 0) continue;

            const handler = HANDLERS[task.type];
            try {
                if (!handler) throw new Error(`No handler for task type "${task.type}"`);
                await handler((task.payloadJsonb as Record<string, unknown>) ?? {});
                await db.automationTask.update({
                    where: { id: task.id },
                    data: { status: 'done', lockedAt: null },
                });
            } catch (err) {
                const attempts = task.attempts + 1;
                const dead = attempts >= task.maxAttempts;
                await db.automationTask.update({
                    where: { id: task.id },
                    data: {
                        status: dead ? 'dead' : 'queued',
                        attempts,
                        lockedAt: null,
                        lastError: err instanceof Error ? err.message : String(err),
                        // Exponential backoff: 1m, 2m, 4m, ...
                        runAt: new Date(Date.now() + Math.min(2 ** attempts, 60) * 60_000),
                    },
                });
                logger.warn('automation task failed', { id: task.id, type: task.type, attempts, dead });
            }
        }
    } catch (error) {
        logger.error('automation runner loop error', { error });
    } finally {
        running = false;
    }
}

export function startAutomationRunner(): void {
    if (process.env.AUTOMATION_RUNNER_ENABLED !== 'true') {
        logger.info('Automation runner disabled (set AUTOMATION_RUNNER_ENABLED=true to enable)');
        return;
    }
    if (timer) return;
    timer = setInterval(() => {
        void processDueTasks();
    }, POLL_INTERVAL_MS);
    logger.info(`Automation runner started (interval ${POLL_INTERVAL_MS}ms)`);
}

export function stopAutomationRunner(): void {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}
