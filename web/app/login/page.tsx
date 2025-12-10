'use client';

import { useState } from 'react';

export default function LoginPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                window.location.href = '/admin';
            } else {
                alert('Invalid credentials');
                setIsSubmitting(false);
            }
        } catch (error) {
            alert('Login failed');
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            padding: '1rem'
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo/Brand Section */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #f6821f 0%, #e67615 100%)',
                        borderRadius: '50%',
                        marginBottom: '1rem',
                        boxShadow: '0 4px 12px rgba(246, 130, 31, 0.3)'
                    }}>
                        <span style={{ fontSize: '2rem' }}>🛡️</span>
                    </div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        marginBottom: '0.5rem'
                    }}>
                        Meekflare
                    </h1>
                    <p style={{ color: '#999', fontSize: '0.875rem' }}>Admin Portal</p>
                </div>

                {/* Login Card */}
                <div style={{
                    backgroundColor: '#2d2d2d',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    border: '1px solid #444',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '2rem' }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#fff',
                            marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            Sign In
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#ccc',
                                    marginBottom: '0.5rem'
                                }}>
                                    Username
                                </label>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    placeholder="Enter username"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#f6821f'}
                                    onBlur={(e) => e.target.style.borderColor = '#444'}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#ccc',
                                    marginBottom: '0.5rem'
                                }}>
                                    Password
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    placeholder="Enter password"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #444',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#f6821f'}
                                    onBlur={(e) => e.target.style.borderColor = '#444'}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #f6821f 0%, #e67615 100%)',
                                    color: '#fff',
                                    fontWeight: '600',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 12px rgba(246, 130, 31, 0.3)',
                                    transition: 'transform 0.1s, box-shadow 0.2s',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                                onMouseOver={(e) => {
                                    if (!isSubmitting) {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(246, 130, 31, 0.4)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(246, 130, 31, 0.3)';
                                }}
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div style={{
                        backgroundColor: '#252525',
                        padding: '1rem 2rem',
                        borderTop: '1px solid #444'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#888',
                            gap: '0.5rem'
                        }}>
                            <span>🔒</span>
                            <span>Secured by Meekflare</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Notice */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: '#666' }}>
                        Unauthorized access is prohibited and will be logged
                    </p>
                </div>
            </div>
        </div>
    );
}
