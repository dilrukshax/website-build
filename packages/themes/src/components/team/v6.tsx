import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { getText, resolveTeamMembers } from './shared';

export default function TeamV6({ content, tokens }: ThemeComponentProps) {
	const title = getText(content, 'title', 'Operators Behind the Pipeline');
	const subtitle = getText(content, 'subtitle', 'A compact team structure built for weekly shipping');
	const members = resolveTeamMembers(content);
	const sectionBg = tokens.background || '#f6f1e7';
	const titleColor = tokens.text || '#191d24';
	const muted = '#5a6474';
	const primary = tokens.primary || '#ff6a3d';
	const accent = tokens.accent || '#1da99b';
	const border = '#e9ddc9';

	return (
		<section style={{ backgroundColor: sectionBg, padding: 'clamp(78px, 11vw, 130px) 16px', fontFamily: tokens.font }}>
			<div style={{ maxWidth: '1080px', margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: '34px' }}>
					<p style={{ margin: 0, color: primary, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 760 }}>{subtitle}</p>
					<h2 style={{ margin: '8px 0 0 0', color: titleColor, fontSize: 'clamp(30px, 6vw, 44px)', fontWeight: 800 }}>{title}</h2>
				</div>

				<div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
					{members.map((member, index) => (
						<article
							key={member.name + index}
							style={{
								backgroundColor: '#fff',
								border: `1px solid ${border}`,
								borderRadius: '17px',
								padding: '14px',
								display: 'flex',
								gap: '12px',
								alignItems: 'center',
								boxShadow: '0 14px 30px rgba(25, 29, 36, 0.08)',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							<div
								style={{
									position: 'absolute',
									left: 0,
									top: 0,
									width: '100%',
									height: '3px',
									background: `linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
								}}
							/>
							<img
								src={member.image}
								alt={member.name}
								style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px', border: `2px solid ${primary}` }}
							/>
							<div style={{ flex: 1 }}>
								<h3 style={{ margin: 0, color: titleColor, fontSize: '20px' }}>{member.name}</h3>
								<p style={{ margin: '5px 0 0 0', color: primary, fontWeight: 730 }}>{member.role}</p>
								<p style={{ margin: '8px 0 0 0', color: muted, fontSize: '13px' }}>
									{member.bio || 'Owns execution quality and keeps growth decisions tied to measurable outcomes.'}
								</p>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}
