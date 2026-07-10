'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import {
    CalendarDays,
    CheckCircle2,
    CircleHelp,
    CircleDollarSign,
    Gift,
    LayoutDashboard,
    ShieldCheck,
} from 'lucide-react';
import { ThemeToggle } from '../components/theme-toggle';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    display: 'swap',
});

const INSTANCE_TOOLTIP = 'An instance is one website you can build, publish, and manage.';
const DOMAIN_TOOLTIP = 'A custom domain is your own domain (for example, yourbrand.com) connected to one website.';

type PlanFeature = {
    label: string;
    tooltip?: string;
};

type PlanCard = {
    name: string;
    monthly: string;
    annual: string;
    description: string;
    cta: string;
    highlight: boolean;
    features: PlanFeature[];
};

const PLAN_CARDS: PlanCard[] = [
    {
        name: 'Free',
        monthly: '$0',
        annual: '$0',
        description: 'For first launch and early validation',
        cta: 'Start Free',
        highlight: false,
        features: [
            { label: '1 website instance', tooltip: INSTANCE_TOOLTIP },
            { label: '1 custom domain connection', tooltip: DOMAIN_TOOLTIP },
            { label: '5 pages per website instance' },
            { label: '10 accessible themes' },
            { label: '10 bookings per day per instance' },
            { label: '5 active services to display' },
            { label: 'No staff accounts and no add-on bundle' },
        ],
    },
    {
        name: 'Starter',
        monthly: '$6',
        annual: '$70',
        description: 'For solo teams that need paid growth tools',
        cta: 'Request Starter',
        highlight: true,
        features: [
            { label: '1 website instance', tooltip: INSTANCE_TOOLTIP },
            { label: '1 custom domain connection', tooltip: DOMAIN_TOOLTIP },
            { label: '25 pages per website instance' },
            { label: '100 accessible themes' },
            { label: 'Premium templates enabled' },
            { label: 'Unlimited bookings and services' },
            { label: 'Staff accounts + add-on bundle support' },
        ],
    },
    {
        name: 'Freelance',
        monthly: '$29',
        annual: '$290',
        description: 'For multi-brand freelancers and agencies',
        cta: 'Request Freelance',
        highlight: false,
        features: [
            { label: '10 website instances', tooltip: INSTANCE_TOOLTIP },
            { label: '10 custom domain connections', tooltip: DOMAIN_TOOLTIP },
            { label: '25 pages per website instance' },
            { label: '100 accessible themes' },
            { label: 'Premium templates enabled' },
            { label: 'Unlimited bookings and services' },
            { label: 'Staff accounts + add-on bundle support' },
        ],
    },
    {
        name: 'Enterprise',
        monthly: '$199',
        annual: '$1,990',
        description: 'For scale teams with high portfolio volume',
        cta: 'Request Enterprise',
        highlight: false,
        features: [
            { label: '100 website instances', tooltip: INSTANCE_TOOLTIP },
            { label: '100 custom domain connections', tooltip: DOMAIN_TOOLTIP },
            { label: 'Unlimited pages per website instance' },
            { label: '100 accessible themes' },
            { label: 'Premium templates enabled' },
            { label: 'Unlimited bookings and services' },
            { label: 'Staff accounts + add-on bundle support' },
        ],
    },
];

const LIMIT_ROWS = [
    { capability: 'Website instances per tenant', free: '1', starter: '1', freelance: '10', enterprise: '100' },
    { capability: 'Custom domains per tenant', free: '1', starter: '1', freelance: '10', enterprise: '100' },
    { capability: 'Add-on bundle (+1 instance +1 domain)', free: 'No', starter: 'Yes', freelance: 'Yes', enterprise: 'Yes' },
    { capability: 'Pages per website instance', free: '5', starter: '25', freelance: '25', enterprise: 'Unlimited' },
    { capability: 'Accessible themes', free: '10', starter: '100', freelance: '100', enterprise: '100' },
    { capability: 'Premium templates', free: 'No', starter: 'Yes', freelance: 'Yes', enterprise: 'Yes' },
    { capability: 'Bookings per day per instance', free: '10', starter: 'Unlimited', freelance: 'Unlimited', enterprise: 'Unlimited' },
    { capability: 'Active services to display', free: '5', starter: 'Unlimited', freelance: 'Unlimited', enterprise: 'Unlimited' },
    { capability: 'Staff account creation', free: 'No', starter: 'Yes', freelance: 'Yes', enterprise: 'Yes' },
    { capability: 'Website publishing', free: 'Yes', starter: 'Yes', freelance: 'Yes', enterprise: 'Yes' },
    { capability: 'Custom domain feature', free: 'Yes (count-limited)', starter: 'Yes (count-limited)', freelance: 'Yes (count-limited)', enterprise: 'Yes (count-limited)' },
] as const;

const BILLING_STEPS = [
    {
        step: '1. Owner requests',
        detail: 'Tenant owner submits plan change or add-on purchase from Billing.',
    },
    {
        step: '2. Charge pending',
        detail: 'System creates a pending full-term charge (no proration in this phase).',
    },
    {
        step: '3. Superadmin review',
        detail: 'Superadmin confirms or rejects the pending charge.',
    },
    {
        step: '4. Apply on confirm',
        detail: 'Plan/add-on updates and wallet credit application happen only on confirmed payment.',
    },
] as const;

const REFERRAL_RULES = [
    'Referral claim requires valid proofToken from /api/device-check (unexpired and matching referee + referral code).',
    'Activation reward triggers once after referred user completes first tenant + first instance milestone.',
    'Paid milestone rewards trigger only after confirmed paid charge and only once per referee per milestone.',
    'Enterprise milestone creates pending reward candidate; superadmin must approve small/medium/large tier.',
    'Points redemption supports any integer >= 600, where 1 point = 1 cent, credited to selected tenant wallet.',
    'Wallet credit auto-applies on future confirmed charges; points expiry runs lazily and in daily UTC sweep.',
] as const;

const PRICING_FACTS = [
    {
        title: 'Currency and Charging',
        detail: 'All prices are USD. Charges are processed in cents after superadmin confirmation.',
    },
    {
        title: 'Add-On Bundle',
        detail: 'Starter/Freelance/Enterprise can buy add-ons. Each bundle adds +1 instance and +1 custom domain.',
    },
    {
        title: 'Upgrade Safety',
        detail: 'Downgrade and free migration never auto-delete existing resources. New over-limit actions are blocked.',
    },
    {
        title: 'Billing Cadence',
        detail: 'Monthly and annual billing available. Add-on interval always follows the base subscription interval.',
    },
] as const;

function HeroIllustration() {
    return (
        <svg viewBox="0 0 760 520" className="h-full w-full" role="img" aria-label="Website builder and booking illustration">
            <defs>
                <linearGradient id="hero-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f4f2ff" />
                    <stop offset="100%" stopColor="#ebe8ff" />
                </linearGradient>
                <linearGradient id="hero-card" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8f7ff" />
                </linearGradient>
                <linearGradient id="hero-cta" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#5048e5" />
                    <stop offset="100%" stopColor="#6a63ff" />
                </linearGradient>
            </defs>

            <rect x="0" y="0" width="760" height="520" rx="28" fill="url(#hero-bg)" />

            <g opacity="0.35">
                <circle cx="92" cy="88" r="44" fill="#d8d4ff" />
                <circle cx="682" cy="98" r="56" fill="#d8d4ff" />
                <circle cx="660" cy="430" r="68" fill="#d8d4ff" />
            </g>

            <rect x="84" y="72" width="592" height="362" rx="24" fill="url(#hero-card)" stroke="#d5d0ff" strokeWidth="2" />
            <rect x="84" y="72" width="592" height="52" rx="24" fill="#f2f0ff" />
            <circle cx="122" cy="98" r="7" fill="#bcb6ff" />
            <circle cx="146" cy="98" r="7" fill="#bcb6ff" />
            <circle cx="170" cy="98" r="7" fill="#bcb6ff" />
            <rect x="212" y="90" width="240" height="16" rx="8" fill="#d5d0ff" />

            <rect x="116" y="148" width="220" height="248" rx="16" fill="#ffffff" stroke="#e5e1ff" />
            <rect x="140" y="176" width="150" height="18" rx="9" fill="#d7d2ff" />
            <rect x="140" y="208" width="170" height="11" rx="5.5" fill="#ece9ff" />
            <rect x="140" y="228" width="156" height="11" rx="5.5" fill="#ece9ff" />
            <rect x="140" y="248" width="132" height="11" rx="5.5" fill="#ece9ff" />
            <rect x="140" y="282" width="170" height="44" rx="12" fill="url(#hero-cta)" />
            <text x="176" y="309" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700">Book Now</text>

            <rect x="356" y="148" width="290" height="154" rx="16" fill="#ffffff" stroke="#e5e1ff" />
            <rect x="380" y="176" width="150" height="16" rx="8" fill="#d7d2ff" />
            <rect x="380" y="206" width="236" height="10" rx="5" fill="#ece9ff" />
            <rect x="380" y="224" width="220" height="10" rx="5" fill="#ece9ff" />
            <rect x="380" y="242" width="168" height="10" rx="5" fill="#ece9ff" />
            <rect x="380" y="266" width="104" height="24" rx="12" fill="#f1eeff" />

            <rect x="356" y="318" width="290" height="78" rx="16" fill="#ffffff" stroke="#e5e1ff" />
            <rect x="380" y="342" width="144" height="12" rx="6" fill="#d7d2ff" />
            <rect x="380" y="362" width="110" height="10" rx="5" fill="#ece9ff" />
            <rect x="512" y="338" width="112" height="36" rx="10" fill="url(#hero-cta)" />
            <text x="540" y="360" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">Publish</text>
        </svg>
    );
}

export default function HomePage() {
    return (
        <div className={`${inter.className} bg-[#f6f6f8] text-slate-900 dark:bg-[#121121] dark:text-slate-100`}>
            <div className="relative flex min-h-screen w-full flex-col">
                <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md md:px-20 dark:border-slate-800 dark:bg-[#121121]/80">
                    <div className="flex items-center gap-2 text-[#5048e5]">
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Project Aurora</h2>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-3 md:gap-8">
                        <nav className="hidden items-center gap-8 md:flex">
                            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300" href="#product">
                                Product
                            </a>
                            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300" href="#pricing">
                                Pricing
                            </a>
                            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300" href="#limits">
                                Limits
                            </a>
                            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300" href="#billing-flow">
                                Billing Flow
                            </a>
                            <a className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300" href="#referrals">
                                Referrals
                            </a>
                        </nav>
                        <ThemeToggle fullWidth={false} align="right" />
                        <Link href="/login" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#5048e5] dark:text-slate-300">
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="hidden h-10 min-w-[120px] items-center justify-center rounded-lg bg-[#5048e5] px-5 text-sm font-bold text-white shadow-lg shadow-[#5048e5]/20 transition-all hover:opacity-90 active:scale-95 sm:flex"
                        >
                            Start Free
                        </Link>
                    </div>
                </header>

                <main className="flex-1">
                    <section id="product" className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:px-20 md:py-24 lg:grid-cols-2">
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-4">
                                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#5048e5]">DB-driven plans, billing, and referrals</span>
                                <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-6xl dark:text-white">
                                    Run website growth with <span className="text-[#5048e5]">clear limits, verified referrals, and controlled billing.</span>
                                </h1>
                                <p className="max-w-xl text-lg font-normal leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
                                    Project Aurora now enforces each plan directly in API and CMS: usage caps, add-on bundles, manual charge approval, point wallet credits, and fraud-proof referral claims.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="flex h-14 min-w-[180px] items-center justify-center rounded-xl bg-[#5048e5] px-8 text-lg font-bold text-white shadow-xl shadow-[#5048e5]/30 transition-all hover:-translate-y-0.5"
                                >
                                    Start on Free
                                </Link>
                                <Link
                                    href="#pricing"
                                    className="flex h-14 min-w-[180px] items-center justify-center rounded-xl border-2 border-slate-200 bg-transparent px-8 text-lg font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    View Pricing
                                </Link>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex -space-x-2">
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-[#5048e5]/40 dark:border-slate-900" />
                                    <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-400 dark:border-slate-900" />
                                </div>
                                <span>Grandfather-safe migration: existing over-limit assets stay active, new over-limit actions are blocked.</span>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-3xl bg-[#5048e5]/10 blur-3xl" />
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                                    <HeroIllustration />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white py-24 dark:bg-slate-900/50">
                        <div className="mx-auto max-w-7xl px-6 md:px-20">
                            <div className="mb-16 flex flex-col items-center gap-4 text-center">
                                <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
                                    Core Product Capabilities
                                </h2>
                                <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-400">
                                    Publish sites, manage bookings, run billing approvals, and convert referral points into wallet credits that auto-apply to confirmed charges.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                                <div className="group flex flex-col gap-6 rounded-2xl border border-slate-200 bg-[#f6f6f8] p-8 transition-all hover:border-[#5048e5]/30 hover:shadow-xl dark:border-slate-800 dark:bg-[#121121]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5048e5]/10 text-[#5048e5] transition-colors group-hover:bg-[#5048e5] group-hover:text-white">
                                        <LayoutDashboard className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Plan-Gated Builder</h3>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                            API and CMS both enforce limits for instances, pages, themes, templates, services, and staff creation.
                                        </p>
                                    </div>
                                </div>
                                <div className="group flex flex-col gap-6 rounded-2xl border border-slate-200 bg-[#f6f6f8] p-8 transition-all hover:border-[#5048e5]/30 hover:shadow-xl dark:border-slate-800 dark:bg-[#121121]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5048e5]/10 text-[#5048e5] transition-colors group-hover:bg-[#5048e5] group-hover:text-white">
                                        <CalendarDays className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Timezone-Aware Bookings</h3>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                            Daily booking caps are computed by instance timezone (fallback UTC) to keep limit checks consistent.
                                        </p>
                                    </div>
                                </div>
                                <div className="group flex flex-col gap-6 rounded-2xl border border-slate-200 bg-[#f6f6f8] p-8 transition-all hover:border-[#5048e5]/30 hover:shadow-xl dark:border-slate-800 dark:bg-[#121121]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5048e5]/10 text-[#5048e5] transition-colors group-hover:bg-[#5048e5] group-hover:text-white">
                                        <CircleDollarSign className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manual Billing Control</h3>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                            Owners request charges, superadmins confirm/reject, and credits apply automatically only after confirmation.
                                        </p>
                                    </div>
                                </div>
                                <div className="group flex flex-col gap-6 rounded-2xl border border-slate-200 bg-[#f6f6f8] p-8 transition-all hover:border-[#5048e5]/30 hover:shadow-xl dark:border-slate-800 dark:bg-[#121121]">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#5048e5]/10 text-[#5048e5] transition-colors group-hover:bg-[#5048e5] group-hover:text-white">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Fraud-Proof Referrals</h3>
                                        <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                            Claims require signed proof tokens and enterprise rewards stay pending until superadmin tier approval.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 md:px-20">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">Plan Catalog</h2>
                            <p className="mx-auto max-w-3xl text-slate-600 dark:text-slate-400">
                                Canonical plans are Free, Starter, Freelance, and Enterprise. An instance means one website. Hover the help icon on instance/domain rows to see exactly what each plan allows.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {PLAN_CARDS.map((plan) => (
                                <div
                                    key={plan.name}
                                    className={`relative flex flex-col gap-6 rounded-2xl border bg-white p-7 shadow-sm dark:bg-slate-900 ${plan.highlight
                                        ? 'border-2 border-[#5048e5] shadow-xl'
                                        : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-[#5048e5] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                            Popular Upgrade
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                        <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                                        <div className="mt-4 space-y-1">
                                            <p className="text-3xl font-black text-slate-900 dark:text-white">{plan.monthly}<span className="ml-1 text-sm font-medium text-slate-500">/month</span></p>
                                            <p className="text-sm text-slate-500">or {plan.annual}/year</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/register"
                                        className={`flex h-11 w-full items-center justify-center rounded-lg font-bold transition-opacity ${plan.highlight
                                            ? 'bg-[#5048e5] text-white hover:opacity-90'
                                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                    <ul className="flex flex-col gap-3">
                                        {plan.features.map((feature) => (
                                            <li key={`${plan.name}-${feature.label}`} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#5048e5]" />
                                                <div className="flex items-start gap-1.5">
                                                    <span>{feature.label}</span>
                                                    {feature.tooltip && (
                                                        <span className="group/tooltip relative mt-0.5 inline-flex">
                                                            <button
                                                                type="button"
                                                                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-[#5048e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5048e5]/40"
                                                                aria-label={`More information about ${feature.label}`}
                                                            >
                                                                <CircleHelp className="h-3.5 w-3.5" />
                                                            </button>
                                                            <span
                                                                role="tooltip"
                                                                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-600 shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                                            >
                                                                {feature.tooltip}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            Add-on bundle pricing: $3/month or $24/year per bundle. Add-on interval always follows the tenant subscription interval.
                        </div>
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {PRICING_FACTS.map((fact) => (
                                <article key={fact.title} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">{fact.title}</h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{fact.detail}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section id="limits" className="bg-white py-24 dark:bg-slate-900/50">
                        <div className="mx-auto max-w-7xl px-6 md:px-20">
                            <div className="mb-10 text-center">
                                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">Feature and Limitation Matrix</h2>
                                <p className="mx-auto mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
                                    Hard limits are enforced at mutation points in both CMS and API. Existing over-limit resources are grandfathered and remain active; only new over-limit actions are denied.
                                </p>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Capability</th>
                                            <th className="px-4 py-3 text-left">Free</th>
                                            <th className="px-4 py-3 text-left">Starter</th>
                                            <th className="px-4 py-3 text-left">Freelance</th>
                                            <th className="px-4 py-3 text-left">Enterprise</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white text-slate-700 dark:divide-slate-800 dark:bg-[#121121] dark:text-slate-200">
                                        {LIMIT_ROWS.map((row) => (
                                            <tr key={row.capability}>
                                                <td className="px-4 py-3 font-medium">{row.capability}</td>
                                                <td className="px-4 py-3">{row.free}</td>
                                                <td className="px-4 py-3">{row.starter}</td>
                                                <td className="px-4 py-3">{row.freelance}</td>
                                                <td className="px-4 py-3">{row.enterprise}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <section id="billing-flow" className="mx-auto max-w-7xl px-6 py-24 md:px-20">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">Billing Workflow (Manual Confirmation)</h2>
                            <p className="mx-auto mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
                                Plan upgrades, downgrades, and add-ons use pending charges with superadmin review. No proration in this phase.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {BILLING_STEPS.map((item) => (
                                <article key={item.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.step}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.detail}</p>
                                </article>
                            ))}
                        </div>
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-[#f8f8ff] p-5 text-sm text-slate-700 dark:border-slate-800 dark:bg-[#1b1a2f] dark:text-slate-200">
                            Credits are stored in tenant wallet (USD cents), are non-withdrawable, and auto-apply to future confirmed charges.
                        </div>
                    </section>

                    <section id="referrals" className="mx-auto max-w-7xl px-6 pb-24 md:px-20">
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-10">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5048e5]/10 text-[#5048e5]">
                                    <Gift className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Referral Points Program</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Proof-based claims, milestone rewards, and wallet redemption.</p>
                                </div>
                            </div>
                            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {REFERRAL_RULES.map((rule) => (
                                    <li key={rule} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-[#121121] dark:text-slate-200">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#5048e5]" />
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                                Highest active referrer plan multiplier is used when computing reward points across multi-tenant referrers.
                            </div>
                        </div>
                    </section>

                    <section className="relative mx-auto mb-12 max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#5048e5] px-6 py-20 text-center text-white md:px-20">
                        <div
                            className="pointer-events-none absolute left-0 top-0 h-full w-full opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)' }}
                        />
                        <div className="relative z-10 flex flex-col items-center gap-8">
                            <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                                Ready to move from free to controlled growth?
                            </h2>
                            <p className="max-w-2xl text-lg text-white/80 md:text-xl">
                                Launch fast on Free, upgrade with confirmed charges, and scale with add-ons and referral credits.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href="/register"
                                    className="flex h-14 min-w-[200px] items-center justify-center rounded-xl bg-white px-10 text-lg font-bold text-[#5048e5] shadow-2xl transition-transform hover:scale-105 active:scale-95"
                                >
                                    Create Free Account
                                </Link>
                                <Link
                                    href="#referrals"
                                    className="flex h-14 min-w-[200px] items-center justify-center rounded-xl border border-white/40 bg-white/10 px-10 text-lg font-bold text-white transition-transform hover:scale-105 active:scale-95"
                                >
                                    Explore Referral Program
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-slate-200 bg-white px-6 py-12 md:px-20 dark:border-slate-800 dark:bg-[#121121]">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
                        <div className="flex items-center gap-2 text-[#5048e5]">
                            <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Project Aurora</h2>
                        </div>
                        <div className="flex gap-12 text-sm text-slate-500 dark:text-slate-400">
                            <a className="transition-colors hover:text-[#5048e5]" href="#">Privacy Policy</a>
                            <a className="transition-colors hover:text-[#5048e5]" href="#">Terms of Service</a>
                            <a className="transition-colors hover:text-[#5048e5]" href="#">Help Center</a>
                        </div>
                        <p className="text-sm text-slate-400">© {new Date().getFullYear()} Project Aurora. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
