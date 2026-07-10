'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString } from './shared';

export default function HeroV14({ content }: ThemeComponentProps) {
    const badgePrefix = asString(content.badgePrefix, 'World Record:');
    const badgeText = asString(content.badgeText, '$100M Money Models');
    const title = asString(content.title, 'World-Record Breaking - $100M Money Models');
    const ratingText = asString(content.ratingText, 'RATED 4.9/5 ON AMAZON');
    const primaryCtaText = asString(content.primaryCtaText, 'Get $100M Money Models');
    const primaryCtaLink = asString(content.primaryCtaLink, 'https://shop.acquisition.com/products/100m-money-models');
    const heroImageUrl = asString(content.heroImageUrl, asset('cdn/shop/files/2d-mm_1000x137e.png?v=1755445841'));

    return (
        <section className="section_header36 background-color-black text-color-white harmozi-vsl-source">
            <div className="w-layout-grid header36_component">
                <div id="w-node-b46513ac-46b0-324b-578f-03fd6659a2f3-858f3252" className="header36_content text-align-center">
                    <div className="badge background-color-white">
                        <img src={asset('cdn/shop/t/15/assets/FireSimplehc89d.svg?v=147789248826584920361762187164')} loading="lazy" alt="" className="icon-1x1-xsmall" />
                        <p className="text-size-medium text-style-allcaps">
                            <strong className="text-color-blue">{badgePrefix}</strong>
                            <span>{badgeText}</span>
                        </p>
                    </div>
                    <div className="margin-bottom margin-small">
                        <h1 className="text-color-white">{title}</h1>
                    </div>
                    <p className="text-size-medium text-color-white"></p>
                    <div className="margin-top margin-medium">
                        <div className="star-wrapper no-padding">
                            <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img smaller" />
                            <div className="text-weight-semibold text-style-allcaps text-size-small text-color-white">{ratingText}</div>
                        </div>

                        <div className="button-group _2-buttons">
                            <a href={primaryCtaLink} className="button w-button">
                                <span>{primaryCtaText}</span>
                            </a>
                            <a href="#about-alex" className="button is-secondary w-button">
                                <span></span>
                            </a>
                        </div>

                        <div className="social_proof_block">
                            <img src={asset('cdn/shop/files/AVATARSh_1000x0740.png?v=1695848115')} loading="lazy" alt="" className="img_social_proof" />
                            <p className="text-size-small text-align-left text-color-white">
                                Sold over <strong>800,000+</strong> Copies worldwide
                            </p>
                        </div>
                    </div>
                </div>
                <div className="header36_image-wrapper">
                    <img src={heroImageUrl} loading="eager" alt="" className="header36_image" />
                    <img src={heroImageUrl} loading="eager" alt="" className="header36_image mobile_img_36" />
                </div>
            </div>
            <style>{`
                #shopify-section-template--20702194663649__cba2pykhyxn h1.text-color-white,
                .section_header36 h1.text-color-white {
                    font-size: 2.7rem;
                }
                .section_header36 .button.is-secondary,
                .section_header36 .social_proof_block {
                    display: none;
                }
                @media (min-width: 768px) {
                    .section_header36 .badge {
                        margin-top: 20px;
                    }
                    .section_header36 a.button.w-button {
                        margin: 0 auto 20px;
                    }
                }
                @media (max-width: 768px) {
                    .section_header36 h1.text-color-white {
                        font-size: 1.8rem;
                    }
                    .section_header36 .badge .text-size-medium {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </section>
    );
}
