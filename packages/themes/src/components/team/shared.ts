import type { ThemeComponentProps } from '../../types';

export type TeamMember = {
    name: string;
    role: string;
    image: string;
    bio?: string;
    specialty?: string;
};

const FALLBACK_TEAM_MEMBERS: TeamMember[] = [
    {
        name: 'Avery Brooks',
        role: 'Founder',
        image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&q=80&w=900',
        bio: 'Leads strategy, product direction, and quality standards.',
        specialty: 'Strategy',
    },
    {
        name: 'Nora Vale',
        role: 'Creative Director',
        image: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?auto=format&fit=crop&q=80&w=900',
        bio: 'Transforms business positioning into compelling visual stories.',
        specialty: 'Brand',
    },
    {
        name: 'Ethan Cole',
        role: 'Operations Lead',
        image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=900',
        bio: 'Owns delivery systems and keeps every workflow on schedule.',
        specialty: 'Delivery',
    },
    {
        name: 'Mila Park',
        role: 'Customer Success',
        image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=900',
        bio: 'Helps customers onboard quickly and convert more bookings.',
        specialty: 'Retention',
    },
];

export function resolveTeamMembers(content: ThemeComponentProps['content']): TeamMember[] {
    const rawMembers = content.teamMembers;
    if (!Array.isArray(rawMembers) || rawMembers.length === 0) {
        return FALLBACK_TEAM_MEMBERS;
    }

    const normalized = rawMembers.reduce<TeamMember[]>((acc, member) => {
            if (!member || typeof member !== 'object') {
                return acc;
            }

            const candidate = member as Record<string, unknown>;
            const name = typeof candidate.name === 'string' ? candidate.name : '';
            const role = typeof candidate.role === 'string' ? candidate.role : '';
            const image = typeof candidate.image === 'string' ? candidate.image : '';

            if (!name || !role || !image) {
                return acc;
            }

            acc.push({
                name,
                role,
                image,
                bio: typeof candidate.bio === 'string' ? candidate.bio : undefined,
                specialty: typeof candidate.specialty === 'string' ? candidate.specialty : undefined,
            });

            return acc;
        }, []);

    return normalized.length > 0 ? normalized : FALLBACK_TEAM_MEMBERS;
}

export function getText(content: ThemeComponentProps['content'], key: string, fallback: string): string {
    const value = content[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}