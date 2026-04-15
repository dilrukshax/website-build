import React from 'react';
import type { ThemeComponentProps } from '../../types';

interface TestimonialItem {
    quote: string;
    author: string;
    role: string;
}

function normalizeTestimonials(content: Record<string, unknown>): TestimonialItem[] {
    const fromContent = Array.isArray(content.testimonials)
        ? content.testimonials
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const quote = typeof record.quote === 'string' ? record.quote.trim() : '';
                const author = typeof record.author === 'string' ? record.author.trim() : '';
                const role = typeof record.role === 'string' ? record.role.trim() : '';

                if (!quote || !author) {
                    return null;
                }

                return {
                    quote,
                    author,
                    role: role || 'Team member',
                } as TestimonialItem;
            })
            .filter((item): item is TestimonialItem => item !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        {
            quote: 'The structure made it easy to explain the product without overloading visitors on the first screen.',
            author: 'Jordan Lee',
            role: 'Operations lead',
        },
        {
            quote: 'The section pacing feels polished and the visual treatment keeps the page memorable from start to finish.',
            author: 'Avery Shah',
            role: 'Growth manager',
        },
        {
            quote: 'We had room for proof, explanation, and calls to action without the page feeling heavy.',
            author: 'Taylor Brooks',
            role: 'Product owner',
        },
        {
            quote: 'The builder fields were straightforward, so updating quotes and supporting text was quick for the whole team.',
            author: 'Morgan Patel',
            role: 'Content editor',
        },
    ];
}

export default function TestimonialsV5({ content, tokens }: ThemeComponentProps) {
    const title = (content.title as string) || 'What people are saying';
    const subtitle = (content.subtitle as string) || 'Real results from founders, operators, and creators who went live with our ecosystem.';
    const items = normalizeTestimonials(content);
    const sectionFont = tokens.font || '"Inter", sans-serif';

    return (
        <>
            <style>{`
                .theme-v5-testimonials {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};
                    --v5-glow: ${tokens.primary ? tokens.primary + '26' : 'rgba(234, 179, 8, 0.15)'};

                    position: relative;
                    overflow: hidden;
                    padding: 100px 20px 96px;
                    background:
                        radial-gradient(120% 180% at 50% -20%, rgba(239, 68, 68, 0.18) 0%, rgba(11, 17, 33, 0) 38%),
                        var(--v5-bg);
                    color: var(--v5-text);
                }
                .theme-v5-testimonials::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: rgba(56, 117, 255, 0.42);
                }
                .theme-v5-testimonials::after {
                    content: '';
                    position: absolute;
                    top: -132px;
                    left: 50%;
                    width: min(420px, 80vw);
                    height: 220px;
                    transform: translateX(-50%);
                    pointer-events: none;
                    background: radial-gradient(circle, rgba(239, 68, 68, 0.32) 0%, rgba(239, 68, 68, 0.12) 42%, rgba(239, 68, 68, 0) 72%);
                    filter: blur(8px);
                }
                .theme-v5-testimonials-inner {
                    position: relative;
                    z-index: 1;
                    max-width: 1160px;
                    margin: 0 auto;
                }
                .theme-v5-testimonials-head {
                    max-width: 860px;
                    margin: 0 auto 34px;
                    text-align: center;
                }
                .theme-v5-testimonials-head h2 {
                    margin: 0 0 14px;
                    font-size: clamp(32px, 4vw, 48px);
                    font-weight: 800;
                    line-height: 1.15;
                    letter-spacing: -0.02em;
                }
                .theme-v5-testimonials-head p {
                    margin: 0;
                    color: #a0aec0;
                    font-size: 18px;
                    line-height: 1.6;
                }
                .theme-v5-testimonials-scroll {
                    overflow-x: auto;
                    padding-bottom: 24px;
                    scrollbar-width: thin;
                    display: flex;
                    justify-content: center;
                }
                .theme-v5-testimonials-grid {
                    display: grid;
                    grid-auto-flow: column;
                    grid-auto-columns: minmax(300px, 340px);
                    grid-template-rows: repeat(2, minmax(0, 1fr));
                    gap: 20px;
                    min-width: max-content;
                }
                .theme-v5-testimonial-card {
                    min-height: 236px;
                    padding: 24px 24px 22px;
                    border-radius: 24px;
                    background: linear-gradient(180deg, rgba(23, 34, 63, 0.97) 0%, rgba(17, 29, 53, 0.97) 100%);
                    border: 1px solid var(--v5-primary);
                    box-shadow: 0 10px 34px var(--v5-glow);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    gap: 18px;
                }
                .theme-v5-testimonial-quote {
                    margin: 0;
                    color: #ffffff;
                    font-size: 18px;
                    line-height: 1.62;
                    font-weight: 500;
                }
                .theme-v5-testimonial-meta {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .theme-v5-testimonial-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--v5-primary);
                    color: var(--v5-bg);
                    font-weight: 800;
                    flex-shrink: 0;
                }
                .theme-v5-testimonial-author {
                    display: block;
                    font-size: 15px;
                    font-weight: 600;
                }
                .theme-v5-testimonial-role {
                    display: block;
                    margin-top: 3px;
                    color: #98abc8;
                    font-size: 13px;
                }
                @media (max-width: 980px) {
                    .theme-v5-testimonials-head p {
                        max-width: 820px;
                    }
                    .theme-v5-testimonials-grid {
                        grid-template-rows: none;
                        grid-auto-columns: minmax(280px, 320px);
                    }
                }
                @media (max-width: 640px) {
                    .theme-v5-testimonials {
                        padding: 76px 16px 72px;
                    }
                    .theme-v5-testimonials-grid {
                        grid-template-rows: none;
                        grid-auto-columns: minmax(260px, 320px);
                    }
                }
            `}</style>

            <section className="theme-v5-testimonials" id="reviews" style={{ fontFamily: sectionFont }}>
                <div className="theme-v5-testimonials-inner">
                    <div className="theme-v5-testimonials-head">
                        <h2>{title}</h2>
                        <p>{subtitle}</p>
                    </div>

                    <div className="theme-v5-testimonials-scroll">
                        <div className="theme-v5-testimonials-grid">
                            {items.map((item) => (
                                <article key={`${item.author}-${item.quote.slice(0, 24)}`} className="theme-v5-testimonial-card">
                                    <p className="theme-v5-testimonial-quote">"{item.quote}"</p>
                                    <div className="theme-v5-testimonial-meta">
                                        <span className="theme-v5-testimonial-avatar">
                                            {item.author.charAt(0).toUpperCase()}
                                        </span>
                                        <span>
                                            <span className="theme-v5-testimonial-author">{item.author}</span>
                                            <span className="theme-v5-testimonial-role">{item.role}</span>
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
