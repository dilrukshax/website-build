import React, { useRef, useState } from 'react';
import type { ThemeComponentProps } from '../../types';

interface ProofItem {
    label: string;
    value: string;
    tone?: string;
}

function normalizeProofItems(content: Record<string, unknown>): ProofItem[] {
    const fromContent = Array.isArray(content.proofItems)
        ? content.proofItems
            .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const record = item as Record<string, unknown>;
                const label = typeof record.label === 'string' ? record.label.trim() : '';
                const value = typeof record.value === 'string' ? record.value.trim() : '';
                const tone = typeof record.tone === 'string' ? record.tone.trim() : '';

                if (!label || !value) {
                    return null;
                }

                return { label, value, tone } as ProofItem;
            })
            .filter((item): item is ProofItem => item !== null)
        : [];

    if (fromContent.length > 0) {
        return fromContent;
    }

    return [
        { label: 'Active Clients', value: '18+' },
        { label: 'Revenue Generated', value: '$1M+' },
        { label: 'Active Flows', value: '179+' },
    ];
}

/** Convert standard YouTube watch/short URLs to embed URL. Returns null if not a YouTube URL. */
function toYouTubeEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        let videoId: string | null = null;

        if (host === 'youtu.be') {
            videoId = u.pathname.slice(1);
        } else if (
            host === 'youtube.com'
            || host === 'm.youtube.com'
            || host === 'music.youtube.com'
            || host === 'youtube-nocookie.com'
        ) {
            if (u.pathname === '/watch') {
                videoId = u.searchParams.get('v');
            } else if (u.pathname.startsWith('/embed/')) {
                // Already an embed URL
                return url;
            } else if (u.pathname.startsWith('/shorts/')) {
                videoId = u.pathname.split('/shorts/')[1]?.split('/')[0] || null;
            } else if (u.pathname.startsWith('/live/')) {
                videoId = u.pathname.split('/live/')[1]?.split('/')[0] || null;
            }
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
        }
    } catch (_) {
        // Invalid URL – fall through
    }
    return null;
}

function toVimeoEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');

        if (!host.endsWith('vimeo.com')) {
            return null;
        }

        if (host === 'player.vimeo.com' && u.pathname.startsWith('/video/')) {
            return url;
        }

        const id = u.pathname
            .split('/')
            .filter(Boolean)
            .find((segment) => /^\d+$/.test(segment));

        return id ? `https://player.vimeo.com/video/${id}` : null;
    } catch (_) {
        return null;
    }
}

function toLoomEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');

        if (host !== 'loom.com') {
            return null;
        }

        const segments = u.pathname.split('/').filter(Boolean);
        if (segments.length < 2) {
            return null;
        }

        if (segments[0] === 'embed') {
            return url;
        }

        if (segments[0] === 'share') {
            return `https://www.loom.com/embed/${segments[1]}`;
        }
    } catch (_) {
        return null;
    }

    return null;
}

function withAutoplay(url: string): string {
    try {
        const u = new URL(url);
        u.searchParams.set('autoplay', '1');
        u.searchParams.set('playsinline', '1');
        return u.toString();
    } catch (_) {
        return url;
    }
}

function extractVideoUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
        return '';
    }

    // Allow users to paste full iframe embed code in the builder field.
    if (trimmed.includes('<iframe')) {
        const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
        return srcMatch?.[1]?.trim() || '';
    }

    return trimmed;
}

function toGoogleDriveEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'drive.google.com') {
            return null;
        }

        const pathSegments = u.pathname.split('/').filter(Boolean);
        const fileIndex = pathSegments.indexOf('file');
        if (fileIndex >= 0 && pathSegments[fileIndex + 1] === 'd' && pathSegments[fileIndex + 2]) {
            return `https://drive.google.com/file/d/${pathSegments[fileIndex + 2]}/preview`;
        }

        const idFromQuery = u.searchParams.get('id');
        if (idFromQuery) {
            return `https://drive.google.com/file/d/${idFromQuery}/preview`;
        }
    } catch (_) {
        return null;
    }

    return null;
}

function toDropboxDirectUrl(url: string): string | null {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase().replace(/^www\./, '');
        if (host !== 'dropbox.com' && host !== 'dl.dropboxusercontent.com') {
            return null;
        }

        u.searchParams.delete('dl');
        u.searchParams.set('raw', '1');
        return u.toString();
    } catch (_) {
        return null;
    }
}

export default function HeroV5({ content, tokens }: ThemeComponentProps) {
    const eyebrow = (content.eyebrow as string) || 'Proven Funnel Frameworks';
    const title = (content.title as string) || 'Launch Your Course or High-Ticket Offer in 7 Days — Done For You.';
    const subtitle = (content.subtitle as string) || 'We build your entire backend while you focus on what you do best. Stop wasting time on tech headaches and let our experts wire up the ecosystem.';
    const primaryCtaText = (content.primaryCtaText as string) || 'Book Your Launch Now';
    const primaryCtaLink = ((content.primaryCtaLink as string) || '#features').trim() || '#features';
    const secondaryCtaText = (content.secondaryCtaText as string) || 'See How It Works';
    const secondaryCtaLink = ((content.secondaryCtaLink as string) || '#video').trim() || '#video';
    const rawVideoInput = (content.videoUrl as string) || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoUrl = extractVideoUrl(rawVideoInput) || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoPosterUrl = (content.videoPosterUrl as string) || 'https://placehold.co/1200x720/151f38/ffffff?text=Click+to+Play';
    const proofItems = normalizeProofItems(content);
    const sectionFont = tokens.font || '"Inter", sans-serif';

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const youtubeEmbedUrl = toYouTubeEmbedUrl(videoUrl);
    const vimeoEmbedUrl = toVimeoEmbedUrl(videoUrl);
    const loomEmbedUrl = toLoomEmbedUrl(videoUrl);
    const driveEmbedUrl = toGoogleDriveEmbedUrl(videoUrl);
    const dropboxDirectUrl = toDropboxDirectUrl(videoUrl);
    const embedUrl = youtubeEmbedUrl || vimeoEmbedUrl || loomEmbedUrl || driveEmbedUrl;
    const nativeVideoUrl = dropboxDirectUrl || videoUrl;
    const useEmbeddedPlayer = Boolean(embedUrl);
    const iframeSrc = embedUrl ? withAutoplay(embedUrl) : '';
    const [playing, setPlaying] = useState(false);

    const startNativePlayback = () => {
        setPlaying(true);
        const playPromise = videoRef.current?.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                // Ignore blocked autoplay errors; controls stay visible for manual play.
            });
        }
    };

    return (
        <>
            <style>{`
                .theme-v5-hero {
                    --v5-bg: ${tokens.background || '#0b1121'};
                    --v5-text: ${tokens.text || '#ffffff'};
                    --v5-primary: ${tokens.primary || '#eab308'};
                    --v5-secondary: ${tokens.secondary || '#151f38'};
                    --v5-accent: ${tokens.accent || '#ef4444'};
                    
                    position: relative;
                    overflow: hidden;
                    background: var(--v5-bg);
                    color: var(--v5-text);
                    padding: 100px 20px 80px;
                    text-align: center;
                }
                .theme-v5-hero-inner {
                    max-width: 1080px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .theme-v5-hero-header {
                    max-width: 860px;
                    margin: 0 auto 48px;
                }
                .theme-v5-hero-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 24px;
                    color: inherit;
                    opacity: 0.8;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .theme-v5-hero-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--v5-primary);
                    box-shadow: 0 0 16px var(--v5-primary);
                }
                .theme-v5-hero-title {
                    margin: 0 0 24px;
                    font-size: clamp(36px, 5vw, 64px);
                    line-height: 1.15;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }
                .theme-v5-hero-subtitle {
                    margin: 0 auto;
                    max-width: 720px;
                    font-size: 19px;
                    line-height: 1.6;
                    opacity: 0.85;
                }
                .theme-v5-video-wrapper {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto 56px;
                }
                .theme-v5-video-card {
                    position: relative;
                    border-radius: 12px;
                    padding: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
                }
                .theme-v5-video-frame {
                    position: relative;
                    overflow: hidden;
                    border-radius: 8px;
                    aspect-ratio: 16 / 9;
                    background: #000;
                    cursor: pointer;
                }
                .theme-v5-video-frame video,
                .theme-v5-video-frame iframe {
                    width: 100%;
                    height: 100%;
                    display: block;
                    object-fit: cover;
                    border: none;
                }
                .theme-v5-video-poster {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .theme-v5-play-btn {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--v5-accent);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    transition: transform 0.2s ease, filter 0.2s ease;
                    flex-shrink: 0;
                }
                .theme-v5-play-btn:hover {
                    transform: scale(1.08);
                    filter: brightness(1.15);
                }
                .theme-v5-play-btn svg {
                    margin-left: 6px; /* offset to center the triangle visually */
                }
                .theme-v5-hero-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 64px;
                    width: 100%;
                    max-width: 400px;
                }
                .theme-v5-hero-primary {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    min-height: 64px;
                    padding: 16px 32px;
                    border-radius: 999px;
                    font-size: 18px;
                    font-weight: 800;
                    text-decoration: none;
                    text-transform: uppercase;
                    background: var(--v5-accent);
                    color: #ffffff;
                    box-shadow: 0 12px 28px rgba(220, 38, 38, 0.35);
                    transition: transform 0.2s ease, filter 0.2s ease;
                }
                .theme-v5-hero-primary:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
                .theme-v5-hero-secondary {
                    color: var(--v5-text);
                    text-decoration: underline;
                    font-size: 16px;
                    font-weight: 600;
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                }
                .theme-v5-hero-secondary:hover {
                    opacity: 1;
                }
                .theme-v5-hero-proof {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 32px;
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                    padding-top: 48px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                .theme-v5-proof-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                .theme-v5-proof-value {
                    font-size: clamp(28px, 4vw, 42px);
                    font-weight: 800;
                    color: var(--v5-text);
                    line-height: 1;
                }
                .theme-v5-proof-label {
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--v5-primary);
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .theme-v5-hero {
                        padding: 80px 16px 64px;
                    }
                    .theme-v5-hero-title {
                        font-size: 32px;
                    }
                    .theme-v5-hero-proof {
                        display: flex;
                        flex-direction: column;
                        gap: 32px;
                        padding-top: 32px;
                    }
                    .theme-v5-play-btn {
                        width: 64px;
                        height: 64px;
                    }
                }
            `}</style>

            <section className="theme-v5-hero" id="hero" style={{ fontFamily: sectionFont }}>
                <div className="theme-v5-hero-inner">
                    <div className="theme-v5-hero-header">
                        <div className="theme-v5-hero-eyebrow">
                            <span className="theme-v5-hero-dot" />
                            <span>{eyebrow}</span>
                        </div>

                        <h1 className="theme-v5-hero-title">{title}</h1>
                        <p className="theme-v5-hero-subtitle">{subtitle}</p>
                    </div>

                    <div className="theme-v5-video-wrapper">
                        <div className="theme-v5-video-card" id="video">
                            <div className="theme-v5-video-frame">
                                {useEmbeddedPlayer ? (
                                    /* Embedded providers (YouTube/Vimeo/Loom): show poster, then mount iframe on click. */
                                    playing ? (
                                        <iframe
                                            src={iframeSrc}
                                            title="Video"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div
                                            className="theme-v5-video-poster"
                                            style={{ backgroundImage: `url(${videoPosterUrl})` }}
                                            onClick={() => setPlaying(true)}
                                            role="button"
                                            aria-label="Play video"
                                        >
                                            <div className="theme-v5-play-btn">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                                    <polygon points="6,3 20,12 6,21" />
                                                </svg>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    /* Native video: keep player mounted, then start from a user click. */
                                    <>
                                        <video
                                            ref={videoRef}
                                            src={nativeVideoUrl}
                                            poster={videoPosterUrl}
                                            controls={playing}
                                            playsInline
                                            preload="metadata"
                                            onPlay={() => setPlaying(true)}
                                        />
                                        {!playing && (
                                        <div
                                            className="theme-v5-video-poster"
                                            style={{ backgroundImage: `url(${videoPosterUrl})` }}
                                            onClick={startNativePlayback}
                                            role="button"
                                            aria-label="Play video"
                                        >
                                            <div className="theme-v5-play-btn">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                                    <polygon points="6,3 20,12 6,21" />
                                                </svg>
                                            </div>
                                        </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="theme-v5-hero-actions">
                        <a href={primaryCtaLink} className="theme-v5-hero-primary">
                            {primaryCtaText}
                        </a>
                        <a href={secondaryCtaLink} className="theme-v5-hero-secondary">
                            {secondaryCtaText}
                        </a>
                    </div>

                    <div className="theme-v5-hero-proof">
                        {proofItems.map((item) => (
                            <div key={`${item.label}-${item.value}`} className="theme-v5-proof-item">
                                <span className="theme-v5-proof-value">{item.value}</span>
                                <span className="theme-v5-proof-label">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
