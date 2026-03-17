'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api-client';
import { SectionRenderer } from '../../../components/builder/section-renderer';
import { SchemaForm } from '../../../components/builder/schema-form';
import { ThemePicker } from '../../../components/builder/theme-picker';
import { TemplatePicker } from '../../../components/builder/template-picker';

interface PageData {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
    sortOrder: number;
    sectionCount: number;
}

interface SectionData {
    id: string;
    position: number;
    enabled: boolean;
    contentJsonb: Record<string, unknown>;
    stylesJsonb: Record<string, unknown>;
    theme: {
        id: string;
        name: string;
        componentKey: string;
        schemaJsonb: Record<string, unknown>;
        defaultStylesJsonb: Record<string, unknown>;
        version: number;
        feature?: { id: string; name: string; slug: string };
    };
}

interface WebsiteSettings {
    tokens: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
        background: string;
        font: string;
    };
    features: Record<string, boolean>;
    header: Record<string, unknown>;
    footer: Record<string, unknown>;
}

const DEFAULT_TOKENS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    text: '#1f2937',
    background: '#ffffff',
    font: 'Inter',
};

export default function BuilderPage() {
    const { currentInstance } = useAuth();

    const [pages, setPages] = useState<PageData[]>([]);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [settings, setSettings] = useState<WebsiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [showNewPage, setShowNewPage] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const tokens = settings?.tokens || DEFAULT_TOKENS;
    const selectedSection = sections.find((s) => s.id === selectedSectionId);

    // Load pages
    const loadPages = useCallback(async () => {
        const res = await api.get<PageData[]>('/cms/pages');
        if (res.success && res.data) {
            setPages(res.data);
            if (res.data.length > 0 && !selectedPageId) {
                setSelectedPageId(res.data[0]!.id);
            }
        }
    }, [selectedPageId]);

    // Load sections for selected page
    const loadSections = useCallback(async () => {
        if (!selectedPageId) return;
        const res = await api.get<SectionData[]>(`/cms/pages/${selectedPageId}/sections`);
        if (res.success && res.data) {
            setSections(res.data);
        }
    }, [selectedPageId]);

    // Load settings
    const loadSettings = useCallback(async () => {
        const res = await api.get<{ settings: WebsiteSettings }>('/cms/builder/settings');
        if (res.success && res.data) {
            setSettings(res.data.settings);
        }
    }, []);

    useEffect(() => {
        if (currentInstance) {
            setLoading(true);
            Promise.all([loadPages(), loadSettings()]).then(() => setLoading(false));
        }
    }, [currentInstance, loadPages, loadSettings]);

    useEffect(() => {
        if (selectedPageId) {
            loadSections();
        }
    }, [selectedPageId, loadSections]);

    // Create page
    const handleCreatePage = async () => {
        if (!newPageTitle.trim()) return;
        const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const res = await api.post<PageData>('/cms/pages', { title: newPageTitle, slug: slug || 'page' });
        if (res.success) {
            setNewPageTitle('');
            setShowNewPage(false);
            await loadPages();
            if (res.data) setSelectedPageId(res.data.id);
        }
    };

    // Delete page
    const handleDeletePage = async (pageId: string) => {
        if (!confirm('Delete this page?')) return;
        await api.del(`/cms/pages/${pageId}`);
        if (selectedPageId === pageId) setSelectedPageId(null);
        await loadPages();
    };

    // Add section
    const handleAddSection = async (themeId: string) => {
        if (!selectedPageId) return;
        const res = await api.post<SectionData>(`/cms/pages/${selectedPageId}/sections`, { themeId });
        if (res.success) {
            await loadSections();
        }
    };

    // Apply template
    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedPageId) return;
        setTemplatePickerOpen(false);
        setLoading(true);
        const res = await api.post(`/cms/pages/${selectedPageId}/apply-template`, { templateId });
        if (res.success) {
            await loadSections();
        }
        setLoading(false);
    };

    // Update section content
    const handleUpdateSection = async (sectionId: string, contentJsonb: Record<string, unknown>) => {
        setSaving(true);
        const previousSections = [...sections];
        
        // Optimistic UI updates
        setSections(sections.map(s => s.id === sectionId ? { ...s, contentJsonb } : s));
        
        try {
            await api.put(`/cms/sections/${sectionId}`, { contentJsonb });
            await loadSections();
        } catch (error) {
            console.error('Failed to update section', error);
            setSections(previousSections);
            alert('Failed to update section');
        } finally {
            setSaving(false);
        }
    };

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('Remove this section?')) return;
        
        const previousSections = [...sections];
        // Optimistic delete
        setSections(sections.filter(s => s.id !== sectionId));
        if (selectedSectionId === sectionId) setSelectedSectionId(null);
        
        try {
            await api.del(`/cms/sections/${sectionId}`);
            await loadSections();
        } catch (error) {
            console.error('Failed to delete section', error);
            setSections(previousSections);
            alert('Failed to delete section');
        }
    };

    // Move section
    const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sections.length) return;

        const previousSections = [...sections];

        const reorderedPayload = sections.map((s, i) => ({
            id: s.id,
            position: i === idx ? sections[swapIdx]!.position : i === swapIdx ? sections[idx]!.position : s.position,
        }));

        // Optimistic UI sorting locally
        const updatedSections = [...sections];
        const temp = { ...updatedSections[idx]! };
        updatedSections[idx] = { ...updatedSections[swapIdx]!, position: reorderedPayload.find(r => r.id === updatedSections[swapIdx]!.id)!.position };
        updatedSections[swapIdx] = { ...temp, position: reorderedPayload.find(r => r.id === temp.id)!.position };
        
        setSections(updatedSections.sort((a,b) => a.position - b.position));

        try {
            await api.put(`/cms/pages/${selectedPageId}/sections/reorder`, { sections: reorderedPayload });
            await loadSections();
        } catch (error) {
            console.error('Failed to move section', error);
            setSections(previousSections);
            alert('Failed to move section');
        }
    };

    // Publish
    const handlePublish = async () => {
        setPublishing(true);
        const res = await api.post<{ version: number }>('/cms/builder/publish');
        if (res.success && res.data) {
            alert(`Published version ${res.data.version} successfully!`);
        } else {
            alert('Publish failed');
        }
        setPublishing(false);
    };

    // Save settings
    const handleSaveSettings = async (newSettings: Partial<WebsiteSettings>) => {
        setSaving(true);
        const res = await api.put<{ settings: WebsiteSettings }>('/cms/builder/settings', newSettings);
        if (res.success && res.data) {
            setSettings(res.data.settings);
        }
        setSaving(false);
    };

    if (!currentInstance) {
        return <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Select a website to start building</div>;
    }

    if (loading) {
        return <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Loading builder...</div>;
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* Left Panel — Pages */}
            <div style={{ width: '220px', borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb', overflow: 'auto', flexShrink: 0 }}>
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Pages</h3>
                        <button onClick={() => setShowNewPage(true)} style={{ fontSize: '18px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>+</button>
                    </div>
                    {showNewPage && (
                        <div style={{ marginBottom: '12px', display: 'flex', gap: '4px' }}>
                            <input
                                type="text"
                                value={newPageTitle}
                                onChange={(e) => setNewPageTitle(e.target.value)}
                                placeholder="Page title"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                                style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                                autoFocus
                            />
                            <button onClick={handleCreatePage} style={{ padding: '6px 10px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                        </div>
                    )}
                    {pages.map((page) => (
                        <div
                            key={page.id}
                            style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                                backgroundColor: selectedPageId === page.id ? '#3b82f6' : 'transparent',
                                color: selectedPageId === page.id ? '#fff' : '#374151',
                            }}
                            onClick={() => { setSelectedPageId(page.id); setSelectedSectionId(null); setShowSettings(false); }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 500 }}>/{page.slug === '/' ? '' : page.slug}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: selectedPageId === page.id ? 'rgba(255,255,255,0.7)' : '#9ca3af', fontSize: '14px' }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                    <button
                        onClick={() => { setShowSettings(true); setSelectedSectionId(null); }}
                        style={{
                            width: '100%', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                            backgroundColor: showSettings ? '#3b82f6' : '#e5e7eb',
                            color: showSettings ? '#fff' : '#374151',
                        }}
                    >
                        Website Settings
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{
                            width: '100%', padding: '10px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginTop: '8px',
                            backgroundColor: publishing ? '#9ca3af' : '#10b981', color: '#fff',
                        }}
                    >
                        {publishing ? 'Publishing...' : 'Publish Website'}
                    </button>
                    {currentInstance?.subdomain && (
                        <a
                            href={`/preview/${currentInstance.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'block', width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginTop: '8px',
                                backgroundColor: '#fff', color: '#374151', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box'
                            }}
                        >
                            View Live Site ↗
                        </a>
                    )}
                </div>
            </div>

            {/* Center Panel — Canvas */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#e5e7eb' }}>
                <div style={{ maxWidth: '1280px', margin: '24px auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    {sections.length === 0 && selectedPageId && (
                        <div style={{ padding: '80px 24px', textAlign: 'center', color: '#9ca3af' }}>
                            <p style={{ fontSize: '16px', marginBottom: '16px' }}>This page has no sections yet</p>
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setTemplatePickerOpen(true)}
                                    style={{ padding: '10px 24px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                                >
                                    ✨ Choose a Template
                                </button>
                                <button
                                    onClick={() => setThemePickerOpen(true)}
                                    style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                                >
                                    + Add First Section
                                </button>
                            </div>
                        </div>
                    )}
                    {sections.map((section, idx) => (
                        <div
                            key={section.id}
                            style={{
                                position: 'relative',
                                outline: selectedSectionId === section.id ? '2px solid #3b82f6' : '2px solid transparent',
                                cursor: 'pointer',
                            }}
                            onClick={() => { setSelectedSectionId(section.id); setShowSettings(false); }}
                        >
                            {/* Section toolbar */}
                            <div style={{
                                position: 'absolute', top: '4px', right: '4px', zIndex: 90,
                                display: 'flex', gap: '4px', opacity: 0.85,
                            }}>
                                <span style={{ fontSize: '11px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                                    {section.theme.name}
                                </span>
                                {idx > 0 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'up'); }} style={{ padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>↑</button>
                                )}
                                {idx < sections.length - 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'down'); }} style={{ padding: '2px 6px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>↓</button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }} style={{ padding: '2px 6px', backgroundColor: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>×</button>
                            </div>
                            <SectionRenderer
                                componentKey={section.theme.componentKey}
                                content={section.contentJsonb}
                                styles={section.stylesJsonb}
                                tokens={tokens}
                                isEditor
                            />
                        </div>
                    ))}
                    {sections.length > 0 && (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <button
                                onClick={() => setThemePickerOpen(true)}
                                style={{ padding: '8px 20px', backgroundColor: '#f3f4f6', color: '#6b7280', border: '2px dashed #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
                            >
                                + Add Section
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Pop-up Modal for Form Editing */}
            {selectedSection && !showSettings && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: '#fff', borderRadius: '8px', width: '500px', maxWidth: '90vw',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#111827' }}>Edit {selectedSection.theme.name}</h3>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>{selectedSection.theme.componentKey}</p>
                            </div>
                            <button onClick={() => setSelectedSectionId(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', padding: '0 4px' }}>&times;</button>
                        </div>
                        
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <SchemaForm
                                schema={selectedSection.theme.schemaJsonb as unknown as React.ComponentProps<typeof SchemaForm>['schema']}
                                values={selectedSection.contentJsonb}
                                onChange={(values) => handleUpdateSection(selectedSection.id, values)}
                                pages={pages}
                            />
                        </div>

                        <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f9fafb', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
                            <button 
                                onClick={() => setSelectedSectionId(null)}
                                style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-over for Website Settings */}
            <div style={{ 
                position: 'fixed', top: 0, right: 0, bottom: 0, width: '360px', 
                backgroundColor: '#fff', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
                transform: showSettings ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease-in-out',
                zIndex: 999,
                borderLeft: '1px solid #e5e7eb', overflow: 'auto'
            }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Website Settings</h2>
                    <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                </div>
                <SettingsPanel settings={settings} onSave={handleSaveSettings} saving={saving} />
            </div>

            <ThemePicker open={themePickerOpen} onClose={() => setThemePickerOpen(false)} onSelect={handleAddSection} />
            <TemplatePicker open={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} onSelect={handleApplyTemplate} />
        </div>
    );
}

// ============================================================
// Settings Panel (Tokens + Features + Header + Footer)
// ============================================================

const AVAILABLE_FEATURES = [
    { key: 'booking', label: 'Booking Widget' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'contact', label: 'Contact Form' },
    { key: 'blog', label: 'Blog' },
    { key: 'reviews', label: 'Reviews' },
];

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '4px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' };
const smallBtnStyle: React.CSSProperties = { padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

function SettingsPanel({ settings, onSave, saving }: {
    settings: WebsiteSettings | null;
    onSave: (settings: Partial<WebsiteSettings>) => void;
    saving: boolean;
}) {
    const [activeTab, setActiveTab] = useState<'tokens' | 'features' | 'header' | 'footer'>('tokens');
    const [tokens, setTokens] = useState(settings?.tokens || DEFAULT_TOKENS);
    const [features, setFeatures] = useState<Record<string, boolean>>(settings?.features || { booking: true, gallery: true, testimonials: true, contact: true });
    const [header, setHeader] = useState<{ logoUrl?: string; logoAlt?: string; menu: Array<{ label: string; href: string }> }>(
        (settings?.header as { logoUrl?: string; logoAlt?: string; menu: Array<{ label: string; href: string }> }) || { menu: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Services', href: '/services' }, { label: 'Contact', href: '/contact' }] },
    );
    const [footer, setFooter] = useState<{ copyrightText?: string; columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>; social: Array<{ platform: string; url: string }> }>(
        (settings?.footer as { copyrightText?: string; columns: Array<{ title: string; links: Array<{ label: string; href: string }> }>; social: Array<{ platform: string; url: string }> }) || { columns: [], social: [] },
    );

    const handleSave = () => {
        onSave({ tokens, features, header, footer });
    };

    const tabs = [
        { key: 'tokens' as const, label: 'Colors' },
        { key: 'features' as const, label: 'Features' },
        { key: 'header' as const, label: 'Header' },
        { key: 'footer' as const, label: 'Footer' },
    ];

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100% - 57px)' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '6px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                            backgroundColor: activeTab === tab.key ? '#3b82f6' : '#f3f4f6',
                            color: activeTab === tab.key ? '#fff' : '#374151',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
                {/* Tokens Tab */}
                {activeTab === 'tokens' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={sectionTitleStyle}>Theme Colors & Font</div>
                        {Object.entries(tokens).map(([key, value]) => (
                            <div key={key}>
                                <label style={{ ...labelStyle, textTransform: 'capitalize' }}>{key}</label>
                                {key === 'font' ? (
                                    <input type="text" value={value} onChange={(e) => setTokens({ ...tokens, [key]: e.target.value })} style={inputStyle} />
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input type="color" value={value} onChange={(e) => setTokens({ ...tokens, [key]: e.target.value })} style={{ width: '36px', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                                        <input type="text" value={value} onChange={(e) => setTokens({ ...tokens, [key]: e.target.value })} style={{ ...inputStyle, width: 'auto', flex: 1 }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Features Tab */}
                {activeTab === 'features' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={sectionTitleStyle}>Feature Toggles</div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0' }}>Enable or disable features for this website. Disabled features will hide their sections on the public site.</p>
                        {AVAILABLE_FEATURES.map((feat) => (
                            <div key={feat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                                <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{feat.label}</span>
                                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={features[feat.key] ?? false}
                                        onChange={(e) => setFeatures({ ...features, [feat.key]: e.target.checked })}
                                        style={{ width: '40px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                )}

                {/* Header Tab */}
                {activeTab === 'header' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={sectionTitleStyle}>Header Settings</div>
                        <div>
                            <label style={labelStyle}>Logo URL</label>
                            <input type="text" value={header.logoUrl || ''} onChange={(e) => setHeader({ ...header, logoUrl: e.target.value })} placeholder="https://..." style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Logo Alt Text</label>
                            <input type="text" value={header.logoAlt || ''} onChange={(e) => setHeader({ ...header, logoAlt: e.target.value })} placeholder="Company Name" style={inputStyle} />
                        </div>

                        <div style={{ ...sectionTitleStyle, marginTop: '8px' }}>Navigation Menu</div>
                        {header.menu.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="text" value={item.label} onChange={(e) => { const m = [...header.menu]; m[idx] = { ...m[idx]!, label: e.target.value }; setHeader({ ...header, menu: m }); }} placeholder="Label" style={{ ...inputStyle, flex: 1 }} />
                                <input type="text" value={item.href} onChange={(e) => { const m = [...header.menu]; m[idx] = { ...m[idx]!, href: e.target.value }; setHeader({ ...header, menu: m }); }} placeholder="/page" style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => { const m = header.menu.filter((_, i) => i !== idx); setHeader({ ...header, menu: m }); }} style={{ ...smallBtnStyle, color: '#ef4444', borderColor: '#fca5a5' }}>x</button>
                            </div>
                        ))}
                        <button onClick={() => setHeader({ ...header, menu: [...header.menu, { label: '', href: '/' }] })} style={smallBtnStyle}>+ Add Menu Item</button>
                    </div>
                )}

                {/* Footer Tab */}
                {activeTab === 'footer' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={sectionTitleStyle}>Footer Settings</div>
                        <div>
                            <label style={labelStyle}>Copyright Text</label>
                            <input type="text" value={footer.copyrightText || ''} onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })} placeholder="2026 Company Name" style={inputStyle} />
                        </div>

                        <div style={{ ...sectionTitleStyle, marginTop: '8px' }}>Social Links</div>
                        {footer.social.map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select value={s.platform} onChange={(e) => { const soc = [...footer.social]; soc[idx] = { ...soc[idx]!, platform: e.target.value }; setFooter({ ...footer, social: soc }); }} style={{ ...inputStyle, width: 'auto', flex: '0 0 110px' }}>
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="tiktok">TikTok</option>
                                </select>
                                <input type="text" value={s.url} onChange={(e) => { const soc = [...footer.social]; soc[idx] = { ...soc[idx]!, url: e.target.value }; setFooter({ ...footer, social: soc }); }} placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
                                <button onClick={() => setFooter({ ...footer, social: footer.social.filter((_, i) => i !== idx) })} style={{ ...smallBtnStyle, color: '#ef4444', borderColor: '#fca5a5' }}>x</button>
                            </div>
                        ))}
                        <button onClick={() => setFooter({ ...footer, social: [...footer.social, { platform: 'facebook', url: '' }] })} style={smallBtnStyle}>+ Add Social Link</button>

                        <div style={{ ...sectionTitleStyle, marginTop: '8px' }}>Footer Columns</div>
                        {footer.columns.map((col, colIdx) => (
                            <div key={colIdx} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <input type="text" value={col.title} onChange={(e) => { const cols = [...footer.columns]; cols[colIdx] = { ...cols[colIdx]!, title: e.target.value }; setFooter({ ...footer, columns: cols }); }} placeholder="Column Title" style={{ ...inputStyle, flex: 1, fontWeight: 600 }} />
                                    <button onClick={() => setFooter({ ...footer, columns: footer.columns.filter((_, i) => i !== colIdx) })} style={{ ...smallBtnStyle, color: '#ef4444', borderColor: '#fca5a5' }}>x</button>
                                </div>
                                {col.links.map((link, linkIdx) => (
                                    <div key={linkIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                        <input type="text" value={link.label} onChange={(e) => { const cols = [...footer.columns]; const links = [...cols[colIdx]!.links]; links[linkIdx] = { ...links[linkIdx]!, label: e.target.value }; cols[colIdx] = { ...cols[colIdx]!, links }; setFooter({ ...footer, columns: cols }); }} placeholder="Label" style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '13px' }} />
                                        <input type="text" value={link.href} onChange={(e) => { const cols = [...footer.columns]; const links = [...cols[colIdx]!.links]; links[linkIdx] = { ...links[linkIdx]!, href: e.target.value }; cols[colIdx] = { ...cols[colIdx]!, links }; setFooter({ ...footer, columns: cols }); }} placeholder="/page" style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '13px' }} />
                                        <button onClick={() => { const cols = [...footer.columns]; cols[colIdx] = { ...cols[colIdx]!, links: cols[colIdx]!.links.filter((_, i) => i !== linkIdx) }; setFooter({ ...footer, columns: cols }); }} style={{ ...smallBtnStyle, color: '#ef4444', borderColor: '#fca5a5', padding: '2px 8px' }}>x</button>
                                    </div>
                                ))}
                                <button onClick={() => { const cols = [...footer.columns]; cols[colIdx] = { ...cols[colIdx]!, links: [...cols[colIdx]!.links, { label: '', href: '/' }] }; setFooter({ ...footer, columns: cols }); }} style={{ ...smallBtnStyle, fontSize: '11px' }}>+ Add Link</button>
                            </div>
                        ))}
                        <button onClick={() => setFooter({ ...footer, columns: [...footer.columns, { title: '', links: [] }] })} style={smallBtnStyle}>+ Add Column</button>
                    </div>
                )}
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                style={{
                    width: '100%', marginTop: '16px', padding: '10px 16px',
                    backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                    color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                    flexShrink: 0,
                }}
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
}
