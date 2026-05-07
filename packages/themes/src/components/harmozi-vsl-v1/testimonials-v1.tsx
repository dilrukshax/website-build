'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString, stripHtml } from './shared';

type TestimonialItem = {
    imageUrl?: string;
    quote: string;
    author: string;
    role?: string;
    title?: string;
};

function normalizeItems(content: Record<string, unknown>): TestimonialItem[] {
    const source = Array.isArray(content.testimonials) ? content.testimonials : [];
    const items: TestimonialItem[] = [];

    source.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const record = item as Record<string, unknown>;
        const quote = asString(record.quote);
        const author = asString(record.author);
        if (!quote || !author) return;
        items.push({
            imageUrl: asString(record.imageUrl) || undefined,
            quote,
            author,
            role: asString(record.role) || undefined,
            title: asString(record.title) || undefined,
        });
    });

    return items;
}

function starRow() {
    return (
        <>
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="testimonial17_rating-icon">
                    <div className="icon-embed-xsmall text-color-orange w-embed">
                        <svg width="100%" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.16379 0.551109C8.47316 -0.183704 9.52684 -0.183703 9.83621 0.551111L11.6621 4.88811C11.7926 5.19789 12.0875 5.40955 12.426 5.43636L17.1654 5.81173C17.9684 5.87533 18.294 6.86532 17.6822 7.38306L14.0713 10.4388C13.8134 10.6571 13.7007 10.9996 13.7795 11.3259L14.8827 15.8949C15.0696 16.669 14.2172 17.2809 13.5297 16.8661L9.47208 14.4176C9.18225 14.2427 8.81775 14.2427 8.52793 14.4176L4.47029 16.8661C3.7828 17.2809 2.93036 16.669 3.11727 15.8949L4.22048 11.3259C4.29928 10.9996 4.18664 10.6571 3.92873 10.4388L0.317756 7.38306C-0.294046 6.86532 0.0315611 5.87533 0.834562 5.81173L5.57402 5.43636C5.91255 5.40955 6.20744 5.19789 6.33786 4.88811L8.16379 0.551109Z" fill="currentColor"></path>
                        </svg>
                    </div>
                </div>
            ))}
        </>
    );
}

export default function TestimonialsV14({ content }: ThemeComponentProps) {
    const variant = asString(content.variant, 'cards');
    const title = asString(
        content.title,
        variant === 'grid' ? "We helped 1000's of entrepreneurs SET UP THEIR $100m lead MACHINE" : 'WHAT ENTREPRENEURS Say about $100m LEADS',
    );
    const subtitle = asString(content.subtitle, variant === 'cards' ? 'See what they say' : '');
    const eyebrow = asString(
        content.eyebrow,
        variant === 'marquee' ? 'AVG. RATING of 4.9 / 5.0 STARS ON AMAZON!' : variant === 'grid' ? 'AMAZON BEST SELLER' : 'loved by leading entrepreneurs in the space',
    );
    const ctaText = asString(content.ctaText, variant === 'cards' ? 'DISCOVER THE BOOKS' : '');
    const ctaLink = asString(content.ctaLink, 'https://shop.acquisition.com/collections/all');
    const items = normalizeItems(content);

    if (variant === 'marquee') {
        return (
            <section data-w-id="4b8235b1-0b91-e659-86d6-1c586dc8f2db" className="section_testimonial21 harmozi-vsl-source">
                <div className="padding-section-medium">
                    <div className="padding-global">
                        <div className="container-large">
                            <div className="margin-bottom margin-xxlarge">
                                <div className="text-align-center">
                                    <div className="max-width-large align-center">
                                        <div className="star-wrapper">
                                            <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img" />
                                            <div className="text-weight-semibold text-style-allcaps">{eyebrow}</div>
                                        </div>
                                        <div>
                                            <h2>{title}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div data-w-id="4b8235b1-0b91-e659-86d6-1c586dc8f2e7" className="testimonial21_component_firs">
                        <div className="testimonial21_loop-trigger">
                            {items.map((item, index) => (
                                <div key={`${item.author}-${index}`} className="testimonial21_content">
                                    <div className="margin-bottom margin-small">
                                        <div className="testimonial21_rating-wrapper">{starRow()}</div>
                                        <div className="text-size-medium">{item.quote}</div>
                                    </div>
                                    <div className="testimonial21_client">
                                        <div className="testimonial21_client-info">
                                            <p className="text-weight-semibold">{item.author}</p>
                                            <p style={{ color: '#ffb527' }}>{item.role || 'Verified Buyer'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (variant === 'grid') {
        return (
            <section id="blog-header-3" className="section_review_grid harmozi-vsl-source">
                <div className="padding-global">
                    <div className="container-large">
                        <div className="padding-section-medium">
                            <div className="margin-bottom margin-medium">
                                <div className="text-align-center">
                                    <div className="align-center flex">
                                        <div className="margin-bottom margin-xsmall">
                                            <div className="star-wrapper">
                                                <div className="text-weight-semibold text-style-allcaps">{eyebrow}</div>
                                            </div>
                                        </div>
                                        <div className="margin-bottom margin-small">
                                            <h1>{title}</h1>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="blog3_component">
                                <div className="blog3_list-wrapper">
                                    <div className="w-layout-grid blog3_list reviews_grid_pdp_el">
                                        {items.map((item, index) => (
                                            <div key={`${item.author}-${index}`} className="blog3_item">
                                                <div className="blog3_item-link w-inline-block tc-test">
                                                    <div className="blog3_image-wrapper">
                                                        {item.imageUrl ? <img src={item.imageUrl} loading="lazy" alt="" className="blog3_image" /> : null}
                                                    </div>
                                                    <div className="blog3_content">
                                                        <div className="star-wrapper no-padding">
                                                            <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img smaller" />
                                                            <div className="text-weight-semibold text-style-allcaps text-size-small">EXCELLENT 5</div>
                                                        </div>
                                                        {item.title ? <h3 className="heading-style-h6">{item.title}</h3> : null}
                                                        <div className="text-size-regular">{item.quote}</div>
                                                        <div className="margin-top margin-small">
                                                            <div className="text-weight-semibold">{item.author}</div>
                                                            {item.role ? <div>{item.role}</div> : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`
                    #blog-header-3 .star-wrapper {
                        font-size: 21px;
                    }
                    @media screen and (max-width: 767px) {
                        #blog-header-3 .star-wrapper {
                            background-color: #f4f4f4;
                            padding: 8px 12px;
                            font-size: 18px;
                        }
                    }
                `}</style>
            </section>
        );
    }

    return (
        <section className="section_testimonial17 harmozi-vsl-source">
            <div className="padding-global">
                <div className="container-large">
                    <div className="padding-section-medium">
                        <div className="margin-bottom margin-xxlarge">
                            <div className="text-align-center">
                                <div className="max-width-large align-center text-align-center">
                                    <div className="star-wrapper">
                                        <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img" />
                                        <div className="text-weight-semibold text-style-allcaps">{eyebrow}</div>
                                    </div>
                                    <div className="margin-bottom margin-small">
                                        <h2>{title}</h2>
                                    </div>
                                    <p className="text-size-medium">{subtitle}</p>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial17_component">
                            {items.map((item, index) => (
                                <div key={`${item.author}-${index}`} className="testimonial17_content">
                                    {item.imageUrl ? <img src={item.imageUrl} loading="lazy" className="testimonial17_content_img_overlap" alt="" /> : null}
                                    <div className="margin-bottom margin-small text-align-center">
                                        <div className="testimonial17_rating-wrapper">{starRow()}</div>
                                        <div className="text-size-medium">{stripHtml(item.quote)}</div>
                                    </div>
                                    <div className="testimonial17_client">
                                        <div className="testimonial17_client-info text-align-center">
                                            <p className="text-weight-semibold text-style-allcaps">{item.author}</p>
                                            <p>{item.role || 'Verified Customer'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {ctaText ? (
                            <div className="margin-top margin-medium">
                                <div className="button-group is-center">
                                    <a href={ctaLink} className="button w-button">
                                        <span>{ctaText}</span>
                                    </a>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
