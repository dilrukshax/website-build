import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { promises as fs } from 'fs';

type RuntimeLogSource = 'frontend' | 'backend';

interface RuntimeLogSourceConfig {
    source: RuntimeLogSource;
    label: string;
    envPathKeys: string[];
    relativeCandidates: string[];
    unavailableNote: string;
}

interface RuntimeLogResult {
    source: RuntimeLogSource;
    label: string;
    available: boolean;
    filePath: string | null;
    updatedAt: string | null;
    lineCount: number;
    content: string;
    note?: string;
}

const DEFAULT_LINES = 200;
const MAX_LINES = 2000;
const MAX_BYTES_TO_SCAN = 8 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 64 * 1024;
const ANSI_CONTROL_SEQUENCE_REGEX = /\u001B\[[0-?]*[ -/]*[@-~]/g;

const SOURCE_CONFIGS: Record<RuntimeLogSource, RuntimeLogSourceConfig> = {
    frontend: {
        source: 'frontend',
        label: 'Frontend (CMS)',
        envPathKeys: ['SUPERADMIN_FRONTEND_LOG_PATH', 'SUPERADMIN_FRONTEND_LOG_PATHS'],
        relativeCandidates: [
            'apps/cms/combined.log',
            'apps/cms/frontend.log',
            'apps/cms/dev.log',
            'cms.log',
            'frontend.log',
        ],
        unavailableNote: 'Frontend log file was not found. Start CMS with `pnpm --filter @booking-engine/cms dev:logs` to capture logs.',
    },
    backend: {
        source: 'backend',
        label: 'Backend (API)',
        envPathKeys: ['SUPERADMIN_BACKEND_LOG_PATH', 'SUPERADMIN_BACKEND_LOG_PATHS'],
        relativeCandidates: [
            'combined.log',
            'apps/api/combined.log',
            'packages/api/combined.log',
            'apps/api/error.log',
            'error.log',
        ],
        unavailableNote: 'Backend log file was not found. Ensure the API process has write access to `combined.log`.',
    },
};

function normalizeLineLimit(rawValue: string | undefined): number {
    if (!rawValue) {
        return DEFAULT_LINES;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_LINES;
    }

    const normalized = Math.floor(parsed);
    if (normalized < 1) {
        return DEFAULT_LINES;
    }

    return Math.min(normalized, MAX_LINES);
}

function getSingleQueryValue(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value;
    }

    if (!Array.isArray(value)) {
        return undefined;
    }

    const firstString = value.find((entry) => typeof entry === 'string');
    return typeof firstString === 'string' ? firstString : undefined;
}

function normalizeSource(rawValue: string | undefined): RuntimeLogSource | 'all' {
    if (rawValue === 'frontend' || rawValue === 'backend') {
        return rawValue;
    }

    return 'all';
}

function parseEnvLogPaths(rawValue: string | undefined): string[] {
    if (!rawValue) {
        return [];
    }

    return rawValue
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
}

function resolveCandidatePaths(config: RuntimeLogSourceConfig): string[] {
    const roots: string[] = [];
    let current = process.cwd();

    for (let depth = 0; depth < 6; depth += 1) {
        roots.push(current);

        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }

        current = parent;
    }

    const envPaths = config.envPathKeys.flatMap((key) => parseEnvLogPaths(process.env[key]));
    const rawCandidates = [...envPaths, ...config.relativeCandidates];
    const resolved = new Set<string>();

    for (const candidate of rawCandidates) {
        if (path.isAbsolute(candidate)) {
            resolved.add(candidate);
            continue;
        }

        for (const root of roots) {
            resolved.add(path.resolve(root, candidate));
        }
    }

    return [...resolved];
}

async function findExistingFile(candidates: string[]): Promise<string | null> {
    for (const candidate of candidates) {
        try {
            const stat = await fs.stat(candidate);
            if (stat.isFile()) {
                return candidate;
            }
        } catch {
            // Ignore missing files and continue searching.
        }
    }

    return null;
}

function countNewLines(buffer: Buffer): number {
    let count = 0;

    for (const byte of buffer) {
        if (byte === 10) {
            count += 1;
        }
    }

    return count;
}

function sanitizeLogText(text: string): string {
    return text
        .replace(ANSI_CONTROL_SEQUENCE_REGEX, '')
        .replace(/\u0000/g, '')
        .replace(/\r/g, '');
}

async function tailLogFile(filePath: string, lines: number): Promise<{ content: string; lineCount: number; updatedAt: string | null; truncated: boolean }> {
    const handle = await fs.open(filePath, 'r');

    try {
        const stat = await handle.stat();

        if (stat.size === 0) {
            return {
                content: '',
                lineCount: 0,
                updatedAt: stat.mtime ? stat.mtime.toISOString() : null,
                truncated: false,
            };
        }

        const chunks: Buffer[] = [];
        let scannedBytes = 0;
        let position = stat.size;
        let observedLineBreaks = 0;

        while (position > 0 && observedLineBreaks <= lines && scannedBytes < MAX_BYTES_TO_SCAN) {
            const bytesLeftToScan = MAX_BYTES_TO_SCAN - scannedBytes;
            const readSize = Math.min(CHUNK_SIZE_BYTES, position, bytesLeftToScan);
            const start = position - readSize;
            const buffer = Buffer.alloc(readSize);
            await handle.read(buffer, 0, readSize, start);

            chunks.unshift(buffer);
            scannedBytes += readSize;
            observedLineBreaks += countNewLines(buffer);
            position = start;
        }

        const raw = Buffer.concat(chunks).toString('utf8');
        const sanitized = sanitizeLogText(raw);
        const allLines = sanitized.split('\n');
        const normalizedLines = allLines[allLines.length - 1] === '' ? allLines.slice(0, -1) : allLines;
        const latestLines = normalizedLines.slice(-lines);

        return {
            content: latestLines.join('\n'),
            lineCount: latestLines.length,
            updatedAt: stat.mtime ? stat.mtime.toISOString() : null,
            truncated: position > 0,
        };
    } finally {
        await handle.close();
    }
}

async function loadLogsForSource(source: RuntimeLogSource, lines: number): Promise<RuntimeLogResult> {
    const config = SOURCE_CONFIGS[source];
    const candidates = resolveCandidatePaths(config);
    const filePath = await findExistingFile(candidates);

    if (!filePath) {
        return {
            source,
            label: config.label,
            available: false,
            filePath: null,
            updatedAt: null,
            lineCount: 0,
            content: '',
            note: config.unavailableNote,
        };
    }

    try {
        const tail = await tailLogFile(filePath, lines);
        const note = tail.truncated
            ? 'Showing the most recent lines from a large log file.'
            : undefined;

        return {
            source,
            label: config.label,
            available: true,
            filePath,
            updatedAt: tail.updatedAt,
            lineCount: tail.lineCount,
            content: tail.content,
            ...(note ? { note } : {}),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown read error';

        return {
            source,
            label: config.label,
            available: false,
            filePath,
            updatedAt: null,
            lineCount: 0,
            content: '',
            note: `Failed to read log file: ${message}`,
        };
    }
}

export class SuperAdminLogsController {
    static async runtimeLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawLines = getSingleQueryValue(req.query.lines);
            const rawSource = getSingleQueryValue(req.query.source);
            const lines = normalizeLineLimit(rawLines);
            const source = normalizeSource(rawSource);
            const selectedSources: RuntimeLogSource[] = source === 'all'
                ? ['frontend', 'backend']
                : [source];

            const sources = await Promise.all(
                selectedSources.map((entry) => loadLogsForSource(entry, lines)),
            );

            res.json({
                success: true,
                data: {
                    source,
                    linesRequested: lines,
                    generatedAt: new Date().toISOString(),
                    sources,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
