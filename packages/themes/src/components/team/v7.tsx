import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV7({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Studio Crew');
	const subtitle = getText(content, 'subtitle', 'Small specialist teams with clear accountability lanes');
	const members = resolveTeamMembers(content);

	return (
		<section style={{ backgroundColor: '#f8fafc', padding: 'clamp(72px, 10vw, 120px) 16px', fontFamily: tokens.font }}>
			<div style={{ maxWidth: '1160px', margin: '0 auto' }}>
				<div style={{ marginBottom: '32px' }}>
					<h2 style={{ margin: 0, fontSize: 'clamp(32px, 6vw, 46px)', color: '#0f172a', fontWeight: 900 }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#334155', fontSize: 'clamp(14px, 3vw, 17px)' }}>{subtitle}</p>
				</div>

				<div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								backgroundColor: '#ffffff',
								borderRadius: '14px',
								overflow: 'hidden',
								border: '1px solid #e2e8f0',
								boxShadow: '0 8px 18px rgba(15, 23, 42, 0.06)',
							}}
						>
							<div style={{ height: '6px', background: index % 2 === 0 ? tokens.primary : tokens.accent }} />
							<div style={{ padding: '16px' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
									<img src={member.image} alt={member.name} style={{ width: '60px', height: '60px', borderRadius: '999px', objectFit: 'cover' }} />
									<div>
										<h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{member.name}</h3>
										<p style={{ margin: '4px 0 0 0', color: tokens.primary, fontWeight: 700, fontSize: '14px' }}>{member.role}</p>
									</div>
								</div>
								<p style={{ margin: '14px 0 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
									{member.bio || 'Runs tactical execution with a clear operating cadence and measurable deliverables.'}
								</p>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
