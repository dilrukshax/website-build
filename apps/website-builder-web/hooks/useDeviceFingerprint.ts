'use client';

import { useCallback, useEffect, useState } from 'react';
import { collectFingerprint } from '../lib/fingerprint/fingerprintService';
import { FingerprintResult } from '../lib/fingerprint/types';

const FINGERPRINT_ENABLED = process.env.NEXT_PUBLIC_FINGERPRINT_ENABLED === 'true';

interface UseDeviceFingerprintResult {
    fingerprintData: FingerprintResult | null;
    isCollecting: boolean;
    refreshFingerprint: () => Promise<void>;
}

export function useDeviceFingerprint(): UseDeviceFingerprintResult {
    const [fingerprintData, setFingerprintData] = useState<FingerprintResult | null>(null);
    const [isCollecting, setIsCollecting] = useState(false);

    const refreshFingerprint = useCallback(async () => {
        if (!FINGERPRINT_ENABLED) {
            setFingerprintData(null);
            return;
        }

        setIsCollecting(true);

        try {
            const collected = await collectFingerprint();
            setFingerprintData(collected);
        } catch {
            setFingerprintData(null);
        } finally {
            setIsCollecting(false);
        }
    }, []);

    useEffect(() => {
        void refreshFingerprint();
    }, [refreshFingerprint]);

    return {
        fingerprintData,
        isCollecting,
        refreshFingerprint,
    };
}
