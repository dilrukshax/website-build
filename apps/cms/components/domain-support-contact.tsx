'use client';

import { useMemo, useState } from 'react';
import { Check, MessageCircle, QrCode } from 'lucide-react';

interface DomainSupportContactProps {
    domain?: string;
    title?: string;
    description?: string;
    className?: string;
}

const SUPPORT_WHATSAPP_NUMBER = '94713399099';

export function DomainSupportContact({
    domain,
    title = 'Need help connecting your domain?',
    description = 'Need to connect your domain? Contact support and we will guide you through it quickly.',
    className = '',
}: DomainSupportContactProps) {
    const [copied, setCopied] = useState(false);
    const domainName = domain?.trim() || 'yourdomain.com';

    const whatsappUrl = useMemo(() => {
        const message = `Hi, my website name is ${domainName}. I want to connect my domain to my account`;
        return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }, [domainName]);

    const qrCodeUrl = useMemo(
        () => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(whatsappUrl)}`,
        [whatsappUrl],
    );

    async function copyWhatsappLink() {
        try {
            await navigator.clipboard.writeText(whatsappUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Keep UI stable if clipboard access is unavailable.
        }
    }

    return (
        <section className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 ${className}`.trim()}>
            <p className="inline-flex rounded-full bg-[#5048e5]/10 px-2.5 py-1 text-[11px] font-semibold text-[#5048e5] dark:bg-[#5048e5]/20 dark:text-[#beb9ff]">
                Need to connect your domain? Contact support.
            </p>
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>

            <div className="mt-3 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <img
                    src={qrCodeUrl}
                    alt="WhatsApp support QR code"
                    className="aspect-square w-full max-w-[260px] rounded-md bg-white p-1 object-contain"
                />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1fbc59]"
                >
                    <MessageCircle className="h-4 w-4" />
                    Open WhatsApp
                </a>
                <button
                    type="button"
                    onClick={() => void copyWhatsappLink()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {copied ? <Check className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                    {copied ? 'WhatsApp link copied' : 'Copy WhatsApp link'}
                </button>
            </div>
        </section>
    );
}
