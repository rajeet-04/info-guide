import { supabase } from '@/lib/supabaseClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logout } from '../actions';
import AdminLinkRow from './AdminLinkRow';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session) {
        redirect('/login');
    }

    // Fetch Links AND their visits
    const { data: links, error } = await supabase
        .from('links')
        .select(`
        *,
        visits (
            created_at, ip, city, country, isp, device_type, os, browser, latitude, longitude
        )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        return <div style={{ padding: '2rem', color: '#ef4444' }}>Error loading data: {error.message}</div>;
    }

    // Transform data
    const linksWithStats = links?.map(link => ({
        id: link.id,
        short_code: link.short_code,
        original_url: link.original_url,
        created_at: link.created_at,
        clickCount: link.visits?.length || 0,
        visits: link.visits || []
    })) || [];

    const totalClicks = linksWithStats.reduce((sum, link) => sum + link.clickCount, 0);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #2d2d2d 0%, #252525 100%)',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    border: '1px solid #444',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                                color: '#fff',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #3b8af3 0%, #2563eb 100%)',
                                    borderRadius: '12px',
                                    fontSize: '1.5rem'
                                }}>🛡️</span>
                                Meekflare Admin
                            </h1>
                            <p style={{ color: '#999', fontSize: '0.875rem' }}>Link Management Dashboard</p>
                        </div>
                        <form action={logout}>
                            <button type="submit" style={{
                                backgroundColor: '#444',
                                color: '#fff',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'background-color 0.2s'
                            }}>
                                Logout
                            </button>
                        </form>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginTop: '1.5rem'
                    }}>
                        <div style={{
                            backgroundColor: '#252525',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #333'
                        }}>
                            <div style={{ color: '#999', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Links</div>
                            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>{linksWithStats.length}</div>
                        </div>
                        <div style={{
                            backgroundColor: '#252525',
                            padding: '1.25rem',
                            borderRadius: '8px',
                            border: '1px solid #333'
                        }}>
                            <div style={{ color: '#999', fontSize: '0.75rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clicks</div>
                            <div style={{ color: '#3b8af3', fontSize: '2rem', fontWeight: 'bold' }}>{totalClicks}</div>
                        </div>
                    </div>
                </div>

                {/* Create Link Card */}
                <div style={{
                    backgroundColor: '#2d2d2d',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    border: '1px solid #444',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>➕</span>
                        Create New Link
                    </h3>
                    <form action={createLink} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#ccc',
                                marginBottom: '0.5rem'
                            }}>
                                Short Code
                            </label>
                            <input
                                type="text"
                                name="shortCode"
                                required
                                placeholder="e.g. promo2024"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#ccc',
                                marginBottom: '0.5rem'
                            }}>
                                Destination URL
                            </label>
                            <input
                                type="url"
                                name="originalUrl"
                                required
                                placeholder="https://example.com"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #444',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button type="submit" style={{
                            background: 'linear-gradient(135deg, #3b8af3 0%, #2563eb 100%)',
                            color: '#fff',
                            fontWeight: '600',
                            padding: '0.75rem 2rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 12px rgba(59, 138, 243, 0.3)',
                            transition: 'transform 0.1s, box-shadow 0.2s',
                            whiteSpace: 'nowrap'
                        }}>
                            Create Link
                        </button>
                    </form>
                </div>

                {/* Active Links Card */}
                <div style={{
                    backgroundColor: '#2d2d2d',
                    borderRadius: '12px',
                    padding: '2rem',
                    border: '1px solid #444',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🔗</span>
                        Active Links
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #444' }}>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        color: '#999',
                                        fontWeight: '500',
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Short Code</th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        color: '#999',
                                        fontWeight: '500',
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Destination</th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        color: '#999',
                                        fontWeight: '500',
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Clicks</th>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '1rem',
                                        color: '#999',
                                        fontWeight: '500',
                                        fontSize: '0.875rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {linksWithStats.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{
                                            textAlign: 'center',
                                            padding: '3rem',
                                            color: '#666',
                                            fontSize: '0.875rem'
                                        }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                                            No links created yet. Create your first shortlink above!
                                        </td>
                                    </tr>
                                ) : (
                                    linksWithStats.map((link) => (
                                        <AdminLinkRow key={link.id} link={link} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

async function createLink(formData: FormData) {
    'use server'
    const shortCode = formData.get('shortCode') as string;
    const originalUrl = formData.get('originalUrl') as string;

    if (!shortCode || !originalUrl) return;

    await supabase.from('links').insert({ short_code: shortCode, original_url: originalUrl });
    redirect('/admin');
}