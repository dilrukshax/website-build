'use client';

import React, { useState, useEffect } from 'react';
import type { ThemeComponentProps } from '../../types';

interface Service {
    id: string;
    name: string;
    price: string;
    currency: string;
    duration: number;
}

export default function BookingWidgetV1({ content, styles, tokens, context }: ThemeComponentProps) {
    const title = content.title as string || 'Book an Appointment';
    const subtitle = content.subtitle as string;
    const showServices = (styles.showServices as boolean) !== false;
    const showDatePicker = (styles.showDatePicker as boolean) !== false;

    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('09:00'); // default time
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

    // Fetch services on mount if we have context
    useEffect(() => {
        if (!context?.tenantId || !context?.instanceId) return;
        
        const fetchServices = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/web/services`, {
                    headers: {
                        'x-tenant-id': context.tenantId,
                        'x-instance-id': context.instanceId
                    }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    setServices(data.data.items || data.data);
                }
            } catch (err) {
                console.error('Failed to load services', err);
            }
        };

        fetchServices();
    }, [context]);

    const handleBook = async () => {
        if (!context?.tenantId || !context?.instanceId) {
            setErrorMessage('Unable to create booking at this time (missing site context).');
            return;
        }

        if (!selectedServiceId || !date || !firstName || !lastName || !email) {
            setErrorMessage('Please fill out all fields.');
            return;
        }

        const service = services.find(s => s.id === selectedServiceId);
        if (!service) return;

        setStatus('loading');
        setErrorMessage('');

        const startDateTime = new Date(`${date}T${time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);

        try {
            const res = await fetch(`${API_BASE_URL}/web/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': context.tenantId,
                    'x-instance-id': context.instanceId
                },
                body: JSON.stringify({
                    serviceId: selectedServiceId,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    customer: {
                        firstName,
                        lastName,
                        email
                    }
                })
            });

            const data = await res.json();
            if (data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(data.error?.message || 'Failed to complete booking.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMessage('An unexpected error occurred. Please try again.');
        }
    };

    if (status === 'success') {
        return (
            <section style={{ padding: '80px 24px', backgroundColor: tokens.background, fontFamily: tokens.font }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', backgroundColor: '#f9fafb', padding: '48px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: tokens.text, marginBottom: '8px' }}>Booking Confirmed!</h2>
                    <p style={{ color: '#6b7280' }}>Thank you {firstName}, your appointment has been successfully booked.</p>
                </div>
            </section>
        );
    }

    return (
        <section style={{ padding: '80px 24px', backgroundColor: tokens.background, fontFamily: tokens.font }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 700, color: tokens.text, marginBottom: '12px' }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '18px', color: '#6b7280' }}>{subtitle}</p>}
                </div>
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                    {status === 'error' && (
                        <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '14px' }}>
                            {errorMessage}
                        </div>
                    )}
                    
                    {showServices && (
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>Select Service</label>
                            <select 
                                value={selectedServiceId} 
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', backgroundColor: '#fff', outline: 'none' }}
                            >
                                <option value="">Choose a service...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.price} {s.currency})</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {showDatePicker && (
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>Select Date</label>
                                <input 
                                    type="date" 
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none' }} 
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>Select Time</label>
                                <input 
                                    type="time" 
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none' }} 
                                />
                            </div>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>First Name</label>
                            <input 
                                type="text" 
                                placeholder="John" 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>Last Name</label>
                            <input 
                                type="text" 
                                placeholder="Doe" 
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none' }} 
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: tokens.text, marginBottom: '6px' }}>Email</label>
                        <input 
                            type="email" 
                            placeholder="john@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', outline: 'none' }} 
                        />
                    </div>
                    
                    <button 
                        onClick={handleBook}
                        disabled={status === 'loading'}
                        style={{ 
                            padding: '14px 32px', 
                            backgroundColor: tokens.primary, 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontSize: '16px', 
                            fontWeight: 600, 
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer', 
                            marginTop: '8px',
                            opacity: status === 'loading' ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {status === 'loading' ? 'Booking...' : 'Book Now'}
                    </button>
                </div>
            </div>
        </section>
    );
}
