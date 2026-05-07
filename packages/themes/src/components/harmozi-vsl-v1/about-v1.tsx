'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import { asset, asString } from './shared';

type Bullet = {
    title: string;
    description: string;
};

function normalizeBullets(content: Record<string, unknown>): Bullet[] {
    const source = Array.isArray(content.bullets) ? content.bullets : [];
    return source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const record = item as Record<string, unknown>;
            const title = asString(record.title);
            const description = asString(record.description);
            return title && description ? { title, description } : null;
        })
        .filter((item): item is Bullet => item !== null);
}

export default function AboutV14({ content }: ThemeComponentProps) {
    const variant = asString(content.variant, 'intro');
    const title = asString(
        content.title,
        variant === 'acquisition'
            ? 'About Acquisition.com'
            : variant === 'alex'
              ? 'MEET ALEX HORMOZI: from ZERO to $200m/year'
              : 'Read these 273-pages if you want 2x, 5x or 100x your leads within the next 12 months',
    );
    const body = asString(content.body);
    const eyebrow = asString(content.eyebrow, variant === 'intro' ? 'Announcing $100M Leads' : '');
    const imageUrl = asString(
        content.imageUrl,
        variant === 'acquisition'
            ? asset('cdn/shop/files/cropped-AlexandLeilatransparent_1000x4b57.png?v=1701629214')
            : variant === 'alex'
              ? asset('cdn/shop/files/Placeholder-Image-1h_1000x0740.png?v=1695848115')
              : asset('cdn/shop/t/15/assets/Placeholder-Imagehd2a9.jpg?v=49460024173020463491762187179'),
    );
    const ctaText = asString(
        content.ctaText,
        variant === 'acquisition' ? 'get started! READ THE BOOKS' : variant === 'alex' ? 'Discover the books' : 'DISCOVER $100m leads',
    );
    const ctaLink = asString(
        content.ctaLink,
        variant === 'acquisition'
            ? 'https://shop.acquisition.com/products/single-hardback'
            : variant === 'alex'
              ? 'https://shop.acquisition.com/collections/all'
              : 'https://shop.acquisition.com/products/single-hardback',
    );
    const proofText = asString(content.proofText, 'Sold over 800,000+ copies worldwide | No.1 Bestseller');
    const bullets = normalizeBullets(content);

    if (variant === 'alex') {
        return (
            <section className="section_about_100mleads background-color-gray harmozi-vsl-source" id="about-alex">
                <div className="padding-global">
                    <div className="container-large">
                        <div className="padding-section-medium about_alex">
                            <div className="w-layout-grid layout1_component">
                                <div className="layout1_content align_center_div">
                                    <div className="badge background-color-white text-align-center-mobile">
                                        <img src={asset('cdn/shop/t/15/assets/FireSimplehc89d.svg?v=147789248826584920361762187164')} loading="lazy" alt="" className="icon-1x1-xsmall" />
                                        <p className="text-size-medium text-style-allcaps">
                                            <strong className="text-color-purple">over 100k copies sold on release</strong>
                                        </p>
                                    </div>
                                    <div className="margin-bottom margin-small">
                                        <h3 className="text-align-center-mobile">{title}</h3>
                                    </div>
                                    <p className="text-size-medium text-align-center-mobile">
                                        {body || "Learn about Alex Hormozi's incredible rise from a brick & mortar business owner to a successful entrepreneur and investor."}
                                    </p>
                                    <div className="div-block">
                                        {bullets.map((bullet, index) => (
                                            <div key={`${bullet.title}-${index}`} className="single_element_list">
                                                <p className="number_single_element_list">{index + 1}</p>
                                                <p className="text-size-regular">
                                                    <span>
                                                        {bullet.title} <strong>{bullet.description}</strong>
                                                    </span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="margin-top margin-medium max-width-full">
                                        <div className="button-group">
                                            <a href={ctaLink} className="button max-width-full w-button">
                                                {ctaText}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="social_proof_block">
                                        <img src={asset('cdn/shop/t/15/assets/AVATARShf403.png?v=109721973794652101831762187143')} loading="lazy" alt="" className="img_social_proof" />
                                        <p className="text-size-small">{proofText}</p>
                                    </div>
                                </div>
                                <div className="layout1_image-wrapper">
                                    <img className="layout1_image" src={imageUrl} alt="" loading="lazy" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (variant === 'acquisition') {
        return (
            <section className="section_about_acq harmozi-vsl-source">
                <div className="padding-global">
                    <div className="container-large">
                        <div className="padding-section-medium about">
                            <div className="w-layout-grid layout12_component">
                                <div className="layout12_content">
                                    <div className="margin-bottom margin-small">
                                        <h3>
                                            About <span className="text-color-purple">Acquisition.com</span>
                                        </h3>
                                    </div>
                                    <div className="margin-bottom margin-small">
                                        <p className="text-size-regular">{body || 'At Acquisition.com, our mission is to make real business education available to everyone.'}</p>
                                    </div>
                                    <div className="star-wrapper no-padding">
                                        <img src={asset('cdn/shop/t/15/assets/STARSh7745.svg?v=183158286979890054491762187185')} loading="lazy" alt="" className="stars_img smaller" />
                                        <div className="text-weight-semibold text-style-allcaps text-size-small"></div>
                                    </div>
                                    <div className="margin-top margin-small">
                                        <div className="button-group">
                                            <a href={ctaLink} className="button max-width-full w-button">
                                                <span>{ctaText}</span>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="social_proof_block">
                                        <img src={asset('cdn/shop/files/AVATARSh_1000x0740.png?v=1695848115')} loading="lazy" alt="" className="img_social_proof" />
                                        <p className="text-size-small">{proofText}</p>
                                    </div>
                                </div>
                                <div className="layout12_image-wrapper">
                                    <img className="layout12_image" src={imageUrl} alt="" loading="lazy" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <style>{`.section_about_acq .star-wrapper { display: none; }`}</style>
            </section>
        );
    }

    return (
        <section className="section_about_100mleads harmozi-vsl-source">
            <div className="padding-global">
                <div className="container-large">
                    <div className="padding-section-small">
                        <div className="w-layout-grid layout1_component">
                            <div className="layout1_image-wrapper">
                                <img src={imageUrl} loading="lazy" alt="" className="layout1_image" />
                            </div>
                            <div className="layout1_content align_center_div">
                                <div className="margin-bottom margin-xsmall">
                                    <div className="text-weight-semibold text-style-allcaps align-center-mobile text-style-tagline">{eyebrow}</div>
                                </div>
                                <div className="margin-bottom margin-small align-center-mobile">
                                    <h4 className="center-mobile">{title}</h4>
                                </div>
                                <p className="text-size-medium center-mobile">{body}</p>
                                <div className="margin-top margin-medium max-width-full">
                                    <div className="button-group max-width-full">
                                        <a href={ctaLink} className="button max-width-full w-button">
                                            <span>{ctaText}</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media screen and (max-width: 767px) {
                    .section_about_100mleads .layout1_image-wrapper {
                        order: 999;
                    }
                    .section_about_100mleads .button,
                    .section_about_100mleads .button-group,
                    .section_about_100mleads .margin-top.margin-medium {
                        width: 100% !important;
                        min-width: 100% !important;
                    }
                }
            `}</style>
        </section>
    );
}
