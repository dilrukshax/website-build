import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV10({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Editorial Team Ledger');
	const subtitle = getText(content, 'subtitle', 'A publication-style roster for premium service brands');
	const members = resolveTeamMembers(content);

	return (
		<section style={{ backgroundColor: '#fffdfa', padding: 'clamp(80px, 10vw, 130px) 16px', fontFamily: tokens.font }}>
			<div style={{ maxWidth: '1080px', margin: '0 auto' }}>
				<header style={{ marginBottom: '32px' }}>
					<h2 style={{ margin: 0, fontSize: 'clamp(32px, 6vw, 48px)', color: '#1f2937', fontWeight: 500 }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#6b7280', fontSize: 'clamp(14px, 2.8vw, 17px)' }}>{subtitle}</p>
				</header>

				<div style={{ display: 'grid', gap: '14px' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								display: 'grid',
								gridTemplateColumns: 'auto minmax(0, 1fr)',
								gap: '14px',
								alignItems: 'center',
								padding: '14px',
								borderTop: index === 0 ? `2px solid ${tokens.primary}` : '1px solid #e5e7eb',
								borderBottom: '1px solid #e5e7eb',
							}}
						>
							<div style={{ fontSize: '22px', color: '#9ca3af', fontWeight: 700, minWidth: '38px' }}>{String(index + 1).padStart(2, '0')}</div>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
								<img
									src={member.image}
									alt={member.name}
									style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
								/>
								<div style={{ flex: '1 1 260px' }}>
									<h3 style={{ margin: 0, color: '#1f2937', fontSize: '22px', fontWeight: 600 }}>{member.name}</h3>
									<p style={{ margin: '4px 0 0 0', color: tokens.primary, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '12px', fontWeight: 700 }}>
										{member.role}
									</p>
									<p style={{ margin: '8px 0 0 0', color: '#4b5563', fontSize: '13px' }}>
										{member.bio || 'Combines brand sensibility and operational rigor to keep outcomes high-quality.'}
									</p>
								</div>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
