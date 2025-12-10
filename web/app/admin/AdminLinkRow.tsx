'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Visit {
    created_at: string;
    ip: string;
    city: string | null;
    country: string | null;
    isp: string | null;
    device_type: string | null;
    os: string | null;
    browser: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface LinkData {
    id: string;
    short_code: string;
    original_url: string;
    clickCount: number;
    created_at: string;
    visits?: Visit[];
}

export default function AdminLinkRow({ link }: { link: LinkData }) {
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}/${link.short_code}` : `/${link.short_code}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(fullUrl).then(() => {
            alert('Copied: ' + fullUrl);
        }).catch(err => console.error('Failed to copy', err));
    };

    return (
        <>
            <tr style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '1rem', color: '#3b8af3', fontWeight: 'bold', fontSize: '0.875rem' }}>
                    /{link.short_code}
                </td>
                <td style={{ padding: '1rem', color: '#ccc', fontSize: '0.875rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={link.original_url} target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', textDecoration: 'none' }}>
                        {link.original_url}
                    </a>
                </td>
                <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem', fontWeight: '600' }}>
                    {link.clickCount}
                </td>
                <td style={{ padding: '1rem' }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            backgroundColor: '#444',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            marginRight: '0.5rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#444'}
                    >
                        📋 Copy
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            background: 'linear-gradient(135deg, #3b8af3 0%, #2563eb 100%)',
                            color: '#fff',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(59, 138, 243, 0.3)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        📊 Details
                    </button>
                </td>
            </tr>

            {/* Modal - Rendered via Portal */}
            {showModal && mounted && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '1rem'
                    }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#2d2d2d',
                            borderRadius: '12px',
                            width: '90%',
                            maxWidth: '1000px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            border: '1px solid #444',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            borderBottom: '1px solid #444',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'sticky',
                            top: 0,
                            backgroundColor: '#2d2d2d',
                            zIndex: 1
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                                📊 Visit Details: /{link.short_code}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    color: '#999',
                                    fontSize: '2rem',
                                    cursor: 'pointer',
                                    padding: '0',
                                    lineHeight: '1',
                                    transition: 'color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                                onMouseOut={(e) => e.currentTarget.style.color = '#999'}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '2rem' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #444' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>Time</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>IP</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>Location</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>Device</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>OS/Browser</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#999', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '500' }}>Map</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(!link.visits || link.visits.length === 0) ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                                    No visits yet for this link.
                                                </td>
                                            </tr>
                                        ) : (
                                            link.visits.map((v, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#ccc' }}>
                                                        {new Date(v.created_at).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#ccc', fontFamily: 'monospace' }}>
                                                        {v.ip}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#ccc' }}>
                                                        <div>{v.city || '?'}, {v.country || '?'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{v.isp || 'Unknown ISP'}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#ccc' }}>
                                                        {v.device_type || 'desktop'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#ccc' }}>
                                                        <div>{v.os || 'Unknown'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{v.browser || 'Unknown'}</div>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                                        {v.latitude && v.longitude ? (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${v.latitude},${v.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{
                                                                    color: '#3b8af3',
                                                                    textDecoration: 'none',
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                🗺️ View
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: '#666' }}>-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
