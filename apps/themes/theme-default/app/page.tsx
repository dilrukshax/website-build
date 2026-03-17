import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Landing Page',
    description: 'A clean, customer-ready landing page for service businesses.',
};

export default function HomePage() {
    return (
        <main className="landing-root">
            <header className="topbar">
                <div className="brand">YourBrand</div>
                <nav>
                    <a href="#services">Services</a>
                    <a href="#why-us">Why Us</a>
                    <a href="#contact">Contact</a>
                </nav>
            </header>

            <section className="hero">
                <div className="hero-copy">
                    <p className="eyebrow">Modern service website starter</p>
                    <h1>Turn visitors into paying customers with a clear landing page.</h1>
                    <p>
                        This default layout is built to help service businesses explain value fast,
                        build trust, and guide people to book.
                    </p>
                    <div className="hero-actions">
                        <a href="#contact" className="btn btn-primary">Book a Demo</a>
                        <a href="#services" className="btn btn-secondary">Explore Services</a>
                    </div>
                </div>

                <div className="hero-art" aria-hidden="true">
                    <svg viewBox="0 0 640 420" role="img" aria-label="Landing page illustration">
                        <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#eef5ff" />
                                <stop offset="100%" stopColor="#e6f7f5" />
                            </linearGradient>
                            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#1f6feb" />
                                <stop offset="100%" stopColor="#0ea5a4" />
                            </linearGradient>
                        </defs>
                        <rect x="0" y="0" width="640" height="420" rx="26" fill="url(#g1)" />
                        <rect x="70" y="54" width="500" height="312" rx="20" fill="#fff" stroke="#d8e4f2" strokeWidth="2" />
                        <rect x="70" y="54" width="500" height="46" rx="20" fill="#f2f8ff" />
                        <circle cx="102" cy="77" r="6" fill="#bbd6ff" />
                        <circle cx="124" cy="77" r="6" fill="#bbd6ff" />
                        <circle cx="146" cy="77" r="6" fill="#bbd6ff" />
                        <rect x="182" y="70" width="190" height="14" rx="7" fill="#d6e8ff" />

                        <rect x="100" y="126" width="210" height="212" rx="14" fill="#fbfdff" stroke="#e5eef8" />
                        <rect x="120" y="148" width="120" height="14" rx="7" fill="#d6e8ff" />
                        <rect x="120" y="172" width="164" height="10" rx="5" fill="#edf4fd" />
                        <rect x="120" y="190" width="154" height="10" rx="5" fill="#edf4fd" />
                        <rect x="120" y="208" width="140" height="10" rx="5" fill="#edf4fd" />
                        <rect x="120" y="236" width="160" height="38" rx="10" fill="url(#g2)" />

                        <rect x="332" y="126" width="208" height="102" rx="14" fill="#fbfdff" stroke="#e5eef8" />
                        <rect x="350" y="148" width="112" height="12" rx="6" fill="#d6e8ff" />
                        <rect x="350" y="168" width="170" height="10" rx="5" fill="#edf4fd" />
                        <rect x="350" y="186" width="156" height="10" rx="5" fill="#edf4fd" />

                        <rect x="332" y="236" width="208" height="102" rx="14" fill="#fbfdff" stroke="#e5eef8" />
                        <rect x="350" y="258" width="96" height="12" rx="6" fill="#d6e8ff" />
                        <rect x="350" y="278" width="170" height="10" rx="5" fill="#edf4fd" />
                        <rect x="350" y="296" width="132" height="10" rx="5" fill="#edf4fd" />
                    </svg>
                </div>
            </section>

            <section id="services" className="features">
                <article>
                    <h3>Attract</h3>
                    <p>Use clear service pages and local offers to bring more qualified traffic.</p>
                </article>
                <article>
                    <h3>Convert</h3>
                    <p>Show social proof, keep your main offer visible, and guide users to one action.</p>
                </article>
                <article>
                    <h3>Retain</h3>
                    <p>Follow up after each booking to increase repeat visits and referrals.</p>
                </article>
            </section>

            <section id="why-us" className="value-strip">
                <h2>Built for practical marketing, not technical complexity.</h2>
                <p>
                    Keep your message simple: what you offer, why it matters, and how customers can book now.
                </p>
            </section>

            <section id="contact" className="cta">
                <h2>Ready to launch your customer-focused website?</h2>
                <a href="#" className="btn btn-primary">Start Now</a>
            </section>

            <style>{`
                .landing-root {
                    min-height: 100vh;
                    padding: 28px 22px 56px;
                    color: #0f172a;
                    background: radial-gradient(circle at 10% 15%, #eff6ff 0%, transparent 35%), radial-gradient(circle at 90% 0%, #ecfeff 0%, transparent 30%), #f8fafc;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .topbar {
                    max-width: 1120px;
                    margin: 0 auto 48px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                }

                .brand {
                    font-size: 1.25rem;
                    font-weight: 800;
                    letter-spacing: 0.01em;
                }

                nav {
                    display: flex;
                    gap: 20px;
                }

                nav a {
                    color: #334155;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .hero {
                    max-width: 1120px;
                    margin: 0 auto;
                    display: grid;
                    gap: 28px;
                    grid-template-columns: 1.1fr 1fr;
                    align-items: center;
                }

                .hero-copy h1 {
                    margin: 0;
                    font-size: clamp(2rem, 4.6vw, 3.4rem);
                    line-height: 1.08;
                }

                .eyebrow {
                    margin: 0 0 12px;
                    font-size: 0.78rem;
                    letter-spacing: 0.17em;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: #1d4ed8;
                }

                .hero-copy p {
                    color: #475569;
                    font-size: 1.03rem;
                    line-height: 1.65;
                    max-width: 540px;
                }

                .hero-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 22px;
                    flex-wrap: wrap;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    padding: 12px 20px;
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.95rem;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }

                .btn:hover {
                    transform: translateY(-1px);
                }

                .btn-primary {
                    color: #fff;
                    background: linear-gradient(90deg, #1f6feb, #0ea5a4);
                    box-shadow: 0 8px 24px rgba(30, 64, 175, 0.24);
                }

                .btn-secondary {
                    color: #0f172a;
                    border: 1px solid #cbd5e1;
                    background: #fff;
                }

                .hero-art {
                    border: 1px solid #dbe7f6;
                    border-radius: 16px;
                    background: #fff;
                    box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08);
                    overflow: hidden;
                }

                .hero-art svg {
                    width: 100%;
                    height: auto;
                    display: block;
                }

                .features {
                    max-width: 1120px;
                    margin: 56px auto 0;
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 16px;
                }

                .features article {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 20px;
                }

                .features h3 {
                    margin: 0 0 8px;
                    font-size: 1.12rem;
                }

                .features p {
                    margin: 0;
                    color: #475569;
                    line-height: 1.6;
                }

                .value-strip {
                    max-width: 1120px;
                    margin: 56px auto 0;
                    border-radius: 18px;
                    padding: 30px;
                    background: linear-gradient(140deg, #0f172a 0%, #1d4ed8 100%);
                    color: #fff;
                }

                .value-strip h2 {
                    margin: 0 0 10px;
                    font-size: clamp(1.5rem, 2.6vw, 2.2rem);
                    line-height: 1.22;
                }

                .value-strip p {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.85);
                    line-height: 1.6;
                }

                .cta {
                    max-width: 1120px;
                    margin: 40px auto 0;
                    text-align: center;
                    padding: 42px 16px 0;
                }

                .cta h2 {
                    margin: 0 0 18px;
                    font-size: clamp(1.5rem, 2.8vw, 2.4rem);
                }

                @media (max-width: 960px) {
                    .hero {
                        grid-template-columns: 1fr;
                    }

                    .features {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </main>
    );
}
