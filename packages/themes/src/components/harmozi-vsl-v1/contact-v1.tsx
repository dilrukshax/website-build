'use client';

import React from 'react';
import type { ThemeComponentProps } from '../../types';
import {
    readPrimaryButtonBackground,
    readPrimaryButtonText,
    readSectionBackground,
    readSectionText,
} from '../shared/style-overrides';
import { HARMOZI_VSL_COLORS, HARMOZI_VSL_FONT, asString } from './shared';

export default function ContactV14({ content, styles, tokens }: ThemeComponentProps) {
    const title = asString(content.title, 'keep updated with new free value pieces and book releases');
    const subtitle = asString(content.subtitle, 'Sign up to our monthly newsletter for free gifts, extra worksheets from the books, etc.');
    const emailPlaceholder = asString(content.emailPlaceholder, 'Enter your email');
    const buttonText = asString(content.buttonText, 'Sign up');
    const disclaimer = asString(content.disclaimer, 'By providing your information today, you are giving consent for us or our partners to contact you by mail, phone, text, or email using automated technology to the data provided.');
    const sectionBackground = readSectionBackground(styles, '#efefef');
    const headingColor = readSectionText(styles, HARMOZI_VSL_COLORS.text);
    const bodyColor = headingColor === HARMOZI_VSL_COLORS.text ? HARMOZI_VSL_COLORS.muted : headingColor;
    const buttonBackground = readPrimaryButtonBackground(styles, HARMOZI_VSL_COLORS.text);
    const buttonLabel = readPrimaryButtonText(styles, '#ffffff');

    return (
        <section className="harmozi-vsl-contact" id="newsletter">
            <style>{`
                .harmozi-vsl-contact { background: ${sectionBackground}; font-family: ${tokens.font || HARMOZI_VSL_FONT}; padding: clamp(56px, 8vw, 96px) 20px; }
                .harmozi-vsl-contact__shell { max-width: 760px; margin: 0 auto; text-align: center; }
                .harmozi-vsl-contact__title { margin: 0; color: ${headingColor}; font-size: clamp(2rem, 4.6vw, 3.5rem); line-height: 1.08; letter-spacing: -0.04em; font-weight: 800; }
                .harmozi-vsl-contact__subtitle { margin: 14px auto 0; max-width: 48ch; color: ${bodyColor}; font-size: 17px; line-height: 1.7; }
                .harmozi-vsl-contact__form { display: grid; gap: 14px; margin-top: 28px; }
                .harmozi-vsl-contact__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; }
                .harmozi-vsl-contact__input { width: 100%; min-height: 54px; border-radius: 999px; border: 1px solid #d7d1c9; background: #fff; padding: 0 20px; color: ${headingColor}; font-size: 15px; }
                .harmozi-vsl-contact__button { min-height: 54px; border: none; border-radius: 999px; padding: 0 24px; background: ${buttonBackground}; color: ${buttonLabel}; font-size: 13px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; }
                .harmozi-vsl-contact__disclaimer { margin: 0; color: ${bodyColor}; font-size: 12px; line-height: 1.75; }
                @media (max-width: 640px) { .harmozi-vsl-contact__row { grid-template-columns: 1fr; } }
            `}</style>

            <div className="harmozi-vsl-contact__shell">
                <h2 className="harmozi-vsl-contact__title">{title}</h2>
                <p className="harmozi-vsl-contact__subtitle">{subtitle}</p>
                <form className="harmozi-vsl-contact__form" onSubmit={(event) => event.preventDefault()}>
                    <div className="harmozi-vsl-contact__row">
                        <input className="harmozi-vsl-contact__input" type="email" placeholder={emailPlaceholder} aria-label={emailPlaceholder} />
                        <button className="harmozi-vsl-contact__button" type="submit">{buttonText}</button>
                    </div>
                    <p className="harmozi-vsl-contact__disclaimer">{disclaimer}</p>
                </form>
            </div>
        </section>
    );
}
