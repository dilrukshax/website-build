import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV5({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Core Team');
	const subtitle = getText(content, 'subtitle', 'People shipping measurable outcomes every week');
	const members = resolveTeamMembers(content);

	return (
		<section
			style={{
				background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.secondary} 100%)`,
				padding: 'clamp(72px, 10vw, 120px) 16px',
				fontFamily: tokens.font,
			}}
		>
			<div style={{ maxWidth: '1120px', margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 6vw, 56px)' }}>
					<h2 style={{ margin: 0, color: tokens.text, fontSize: 'clamp(30px, 6vw, 46px)', fontWeight: 800 }}>{title}</h2>
					<p style={{ marginTop: '14px', color: tokens.text, opacity: 0.8, fontSize: 'clamp(15px, 2.8vw, 18px)' }}>{subtitle}</p>
				</div>

				<div style={{ display: 'grid', gap: 'clamp(14px, 2vw, 20px)' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								gap: '16px',
								padding: '16px',
								borderRadius: '18px',
								border: `1px solid ${tokens.text}1f`,
								backgroundColor: '#ffffffc9',
								boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
							}}
						>
							<img
								src={member.image}
								alt={member.name}
								style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '14px', flexShrink: 0 }}
							/>
							<div style={{ flex: '1 1 220px' }}>
								<h3 style={{ margin: 0, color: tokens.text, fontSize: 'clamp(18px, 3vw, 24px)' }}>{member.name}</h3>
								<p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 700, letterSpacing: '0.01em' }}>{member.role}</p>
								<p style={{ margin: '8px 0 0 0', color: '#334155', fontSize: '14px' }}>
									{member.bio || 'Focused on quality delivery, fast turnaround, and strong customer trust.'}
								</p>
							</div>
							<span
								style={{
									alignSelf: 'flex-start',
									padding: '6px 12px',
									borderRadius: '999px',
									backgroundColor: tokens.secondary,
									color: tokens.text,
									fontSize: '12px',
									fontWeight: 700,
								}}
							>
								{member.specialty || `Track ${index + 1}`}
							</span>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
