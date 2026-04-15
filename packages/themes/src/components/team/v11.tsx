import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV11({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Capsule Profiles');
	const subtitle = getText(content, 'subtitle', 'Soft-rounded team cards built for warm, personal brands');
	const members = resolveTeamMembers(content);

	return (
		<section
			style={{
				background: `linear-gradient(180deg, ${tokens.secondary} 0%, #ffffff 70%)`,
				padding: 'clamp(76px, 10vw, 126px) 16px',
				fontFamily: tokens.font,
			}}
		>
			<div style={{ maxWidth: '1140px', margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: '34px' }}>
					<h2 style={{ margin: 0, color: '#0f172a', fontSize: 'clamp(32px, 6vw, 45px)', fontWeight: 900 }}>{title}</h2>
					<p style={{ marginTop: '10px', color: '#334155', fontSize: 'clamp(14px, 3vw, 17px)' }}>{subtitle}</p>
				</div>

				<div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								borderRadius: '24px',
								padding: '18px',
								backgroundColor: '#ffffff',
								border: `1px solid ${tokens.text}1f`,
								boxShadow: '0 10px 26px rgba(15, 23, 42, 0.08)',
								textAlign: 'center',
							}}
						>
							<img
								src={member.image}
								alt={member.name}
								style={{
									width: '110px',
									height: '110px',
									objectFit: 'cover',
									borderRadius: '999px',
									border: `4px solid ${index % 2 === 0 ? tokens.primary : tokens.accent}`,
								}}
							/>
							<h3 style={{ margin: '12px 0 0 0', color: '#0f172a', fontSize: '22px' }}>{member.name}</h3>
							<p style={{ margin: '6px 0 0 0', color: tokens.primary, fontWeight: 700 }}>{member.role}</p>
							<p style={{ margin: '8px 0 0 0', color: '#475569', fontSize: '13px', lineHeight: 1.6 }}>
								{member.bio || 'Supports customer journeys from first visit to confirmed booking.'}
							</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
