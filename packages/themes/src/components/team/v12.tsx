import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV12({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Spotlight Team');
	const subtitle = getText(content, 'subtitle', 'Lead profile plus supporting specialists in one adaptive section');
	const members = resolveTeamMembers(content);
	const [lead, ...rest] = members;

	return (
		<section style={{ backgroundColor: '#f8fafc', padding: 'clamp(78px, 10vw, 132px) 16px', fontFamily: tokens.font }}>
			<div style={{ maxWidth: '1180px', margin: '0 auto' }}>
				<header style={{ marginBottom: '28px' }}>
					<h2 style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(30px, 6vw, 45px)', fontWeight: 900 }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#334155', fontSize: 'clamp(14px, 2.8vw, 17px)' }}>{subtitle}</p>
				</header>

				<div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
					{lead ? (
						<article style={{ backgroundColor: '#ffffff', borderRadius: '18px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
							<img src={lead.image} alt={lead.name} style={{ width: '100%', height: '260px', objectFit: 'cover' }} />
							<div style={{ padding: '16px' }}>
								<p style={{ margin: 0, color: tokens.primary, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
									Team Lead
								</p>
								<h3 style={{ margin: '6px 0 0 0', color: '#0f172a', fontSize: '30px' }}>{lead.name}</h3>
								<p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 700 }}>{lead.role}</p>
								<p style={{ margin: '10px 0 0 0', color: '#475569', lineHeight: 1.7 }}>
									{lead.bio || 'Coordinates strategy, operations, and customer delivery priorities across the full team.'}
								</p>
							</div>
						</article>
					) : null}

					<div style={{ display: 'grid', gap: '12px' }}>
						{rest.map((member, index) => (
							<article
								key={member.name + index}
								style={{
									display: 'grid',
									gridTemplateColumns: '72px minmax(0, 1fr)',
									gap: '10px',
									alignItems: 'center',
									backgroundColor: '#ffffff',
									borderRadius: '14px',
									border: '1px solid #e2e8f0',
									padding: '10px',
								}}
							>
								<img src={member.image} alt={member.name} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover' }} />
								<div>
									<h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px' }}>{member.name}</h4>
									<p style={{ margin: '4px 0 0 0', color: tokens.primary, fontWeight: 700, fontSize: '13px' }}>{member.role}</p>
									<p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '12px' }}>
										{member.specialty || 'Execution stream owner'}
									</p>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
