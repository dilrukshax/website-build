import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV8({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Night Shift Operators');
	const subtitle = getText(content, 'subtitle', 'High-velocity execution with hands-on ownership');
	const members = resolveTeamMembers(content);

	return (
		<section
			style={{
				background: 'radial-gradient(circle at top left, #1e293b 0%, #020617 52%, #020617 100%)',
				padding: 'clamp(76px, 10vw, 132px) 16px',
				fontFamily: tokens.font,
			}}
		>
			<div style={{ maxWidth: '1160px', margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: '38px' }}>
					<h2 style={{ margin: 0, color: '#f8fafc', fontSize: 'clamp(32px, 6vw, 46px)', fontWeight: 900 }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#cbd5e1', fontSize: 'clamp(14px, 3vw, 17px)' }}>{subtitle}</p>
				</div>

				<div style={{ display: 'grid', gap: '18px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								borderRadius: '18px',
								padding: '16px',
								backgroundColor: 'rgba(15, 23, 42, 0.65)',
								border: `1px solid ${index % 2 === 0 ? tokens.primary : tokens.accent}66`,
								backdropFilter: 'blur(10px)',
								boxShadow: '0 18px 28px rgba(2, 6, 23, 0.4)',
							}}
						>
							<img
								src={member.image}
								alt={member.name}
								style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: '12px' }}
							/>
							<h3 style={{ margin: '12px 0 0 0', color: '#f8fafc', fontSize: '22px' }}>{member.name}</h3>
							<p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 700 }}>{member.role}</p>
							<p style={{ margin: '8px 0 0 0', color: '#94a3b8', lineHeight: 1.6, fontSize: '13px' }}>
								{member.bio || 'Owns fast delivery loops and keeps momentum high across every launch sprint.'}
							</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
