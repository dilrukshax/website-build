import crypto from 'node:crypto';
import { env } from '../lib/env';

/**
 * Lightweight Google Analytics 4 Data API client.
 *
 * Uses the GA4 Data API REST endpoint with a service-account JWT bearer token
 * (signed locally with node:crypto, no gRPC/SDK dependency). The service-account
 * JSON is read from GA4_SERVICE_ACCOUNT_JSON and must be granted Viewer access to
 * the target GA4 property.
 */

export interface Ga4ReportRow {
    dimensions: Record<string, string>;
    metrics: Record<string, number>;
}

export interface Ga4ReportRequest {
    propertyId: string;
    startDate: string;
    endDate: string;
    metrics: string[];
    dimensions?: string[];
    limit?: number;
    orderByDate?: boolean;
}

export interface AnalyticsSummary {
    configured: true;
    range: { startDate: string; endDate: string };
    totals: {
        sessions: number;
        users: number;
        avgSessionDuration: number;
    };
    byDate: Array<{ date: string; sessions: number; users: number }>;
    bySource: Array<{ channel: string; sessions: number }>;
    topPages: Array<{ path: string; views: number }>;
    byDevice: Array<{ device: string; sessions: number }>;
}

interface ServiceAccount {
    client_email: string;
    private_key: string;
    token_uri?: string;
}

function base64Url(input: Buffer | string): string {
    return Buffer.from(input).toString('base64url');
}

async function getAccessToken(): Promise<string> {
    const raw = env.ga4ServiceAccountJson();
    if (!raw) {
        throw new Error('GA4_SERVICE_ACCOUNT_JSON is not configured');
    }

    let sa: ServiceAccount;
    try {
        sa = JSON.parse(raw) as ServiceAccount;
    } catch {
        throw new Error('GA4_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    if (!sa.client_email || !sa.private_key) {
        throw new Error('GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
    }

    const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claims = {
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: tokenUri,
        iat: now,
        exp: now + 3600,
    };

    const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    signer.end();
    const signature = signer.sign(sa.private_key, 'base64url');
    const assertion = `${signingInput}.${signature}`;

    const tokenRes = await fetch(tokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }).toString(),
    });
    const tokenJson = (await tokenRes.json()) as { access_token?: string; error_description?: string };
    if (!tokenRes.ok || !tokenJson.access_token) {
        throw new Error(tokenJson.error_description || 'Failed to obtain GA4 access token');
    }
    return tokenJson.access_token;
}

async function runReport(request: Ga4ReportRequest): Promise<Ga4ReportRow[]> {
    const accessToken = await getAccessToken();
    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${request.propertyId}:runReport`;

    const body: Record<string, unknown> = {
        dateRanges: [{ startDate: request.startDate, endDate: request.endDate }],
        metrics: request.metrics.map((name) => ({ name })),
    };
    if (request.dimensions && request.dimensions.length > 0) {
        body.dimensions = request.dimensions.map((name) => ({ name }));
    }
    if (request.limit) {
        body.limit = request.limit;
    }
    if (request.orderByDate) {
        body.orderBys = [{ dimension: { dimensionName: 'date' }, desc: false }];
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const json = (await res.json()) as {
        dimensionHeaders?: Array<{ name: string }>;
        metricHeaders?: Array<{ name: string }>;
        rows?: Array<{
            dimensionValues?: Array<{ value: string }>;
            metricValues?: Array<{ value: string }>;
        }>;
        error?: { message?: string };
    };

    if (!res.ok) {
        throw new Error(json.error?.message || 'GA4 report request failed');
    }
    if (!json.rows) {
        return [];
    }

    const dimensionNames = (json.dimensionHeaders || []).map((h) => h.name);
    const metricNames = (json.metricHeaders || []).map((h) => h.name);

    return json.rows.map((row) => {
        const dimensions: Record<string, string> = {};
        dimensionNames.forEach((name, index) => {
            dimensions[name] = row.dimensionValues?.[index]?.value ?? '';
        });
        const metrics: Record<string, number> = {};
        metricNames.forEach((name, index) => {
            metrics[name] = Number(row.metricValues?.[index]?.value ?? 0);
        });
        return { dimensions, metrics };
    });
}

function buildSummary(rows: Ga4ReportRow[]): AnalyticsSummary['totals'] {
    let sessions = 0;
    let users = 0;
    let durationSum = 0;
    for (const row of rows) {
        sessions += row.metrics.sessions ?? 0;
        users += row.metrics.totalUsers ?? row.metrics.activeUsers ?? 0;
        durationSum += row.metrics.averageSessionDuration ?? 0;
    }
    return {
        sessions,
        users,
        avgSessionDuration: rows.length > 0 ? Math.round((durationSum / rows.length) * 100) / 100 : 0,
    };
}

export async function getAnalyticsSummary(
    propertyId: string,
    startDate: string,
    endDate: string,
): Promise<AnalyticsSummary> {
    const [totalsRows, dateRows, sourceRows, pageRows, deviceRows] = await Promise.all([
        runReport({
            propertyId,
            startDate,
            endDate,
            metrics: ['sessions', 'totalUsers', 'averageSessionDuration'],
        }),
        runReport({
            propertyId,
            startDate,
            endDate,
            metrics: ['sessions', 'totalUsers'],
            dimensions: ['date'],
            orderByDate: true,
        }),
        runReport({
            propertyId,
            startDate,
            endDate,
            metrics: ['sessions'],
            dimensions: ['sessionDefaultChannelGroup'],
        }),
        runReport({
            propertyId,
            startDate,
            endDate,
            metrics: ['screenPageViews'],
            dimensions: ['pagePath'],
            limit: 10,
        }),
        runReport({
            propertyId,
            startDate,
            endDate,
            metrics: ['sessions'],
            dimensions: ['deviceCategory'],
        }),
    ]);

    return {
        configured: true,
        range: { startDate, endDate },
        totals: buildSummary(totalsRows),
        byDate: dateRows.map((row) => ({
            date: row.dimensions.date ?? '',
            sessions: row.metrics.sessions ?? 0,
            users: row.metrics.totalUsers ?? row.metrics.activeUsers ?? 0,
        })),
        bySource: sourceRows
            .map((row) => ({ channel: row.dimensions.sessionDefaultChannelGroup || 'Direct', sessions: row.metrics.sessions ?? 0 }))
            .sort((a, b) => b.sessions - a.sessions),
        topPages: pageRows
            .map((row) => ({ path: row.dimensions.pagePath || '/', views: row.metrics.screenPageViews ?? 0 }))
            .sort((a, b) => b.views - a.views),
        byDevice: deviceRows.map((row) => ({
            device: row.dimensions.deviceCategory || 'unknown',
            sessions: row.metrics.sessions ?? 0,
        })),
    };
}

/**
 * Returns true when GA4 collection is configured server-side. Used to fail-open
 * dashboard requests without throwing (no 500 from missing credentials).
 */
export function isGa4ConfiguredServerSide(): boolean {
    return Boolean(env.ga4ServiceAccountJson());
}
