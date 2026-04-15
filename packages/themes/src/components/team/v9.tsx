import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV9({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Mosaic Team Board');
	const subtitle = getText(content, 'subtitle', 'An asymmetrical layout highlighting the people behind each growth pillar');
	const members = resolveTeamMembers(content);

	return (
		<section style={{ backgroundColor: '#fff', padding: 'clamp(74px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
			<div style={{ maxWidth: '1180px', margin: '0 auto' }}>
				<div style={{ marginBottom: '36px' }}>
					<h2 style={{ margin: 0, color: '#0f172a', fontWeight: 900, fontSize: 'clamp(30px, 6vw, 46px)' }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#334155', fontSize: 'clamp(14px, 3vw, 17px)' }}>{subtitle}</p>
				</div>

				<div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
					{members.map((member, index) => {
						const featured = index === 0;
						return (
							<article
								key={member.name + index}
								style={{
									flex: featured ? '2 1 460px' : '1 1 260px',
									borderRadius: '16px',
									overflow: 'hidden',
									border: '1px solid #e2e8f0',
									backgroundColor: '#f8fafc',
								}}
							>
								<img
									src={member.image}
									alt={member.name}
									style={{ width: '100%', height: featured ? '220px' : '180px', objectFit: 'cover' }}
								/>
								<div style={{ padding: '14px' }}>
									<h3 style={{ margin: 0, color: '#0f172a', fontSize: featured ? '26px' : '20px' }}>{member.name}</h3>
									<p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 700 }}>{member.role}</p>
									<p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
										{member.bio || 'Leads a high-impact workstream and keeps business objectives connected to execution.'}
									</p>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}
