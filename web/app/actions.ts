'use server'

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

export async function logout() {
    (await cookies()).delete('admin_session');
    redirect('/login');
}


// Types for Client Info
interface ClientData {
    shortCode: string;
    userAgent: string;
    referrer: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    screen: string;
    language: string;
}

export async function verifyVisitor(data: ClientData) {
    const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';

    // 1. Resolve Link
    const { data: link, error } = await supabase
        .from('links')
        .select('id, original_url')
        .eq('short_code', data.shortCode)
        .single();

    if (error || !link) {
        return { redirectUrl: 'https://www.google.com' };
    }

    // 2. Log Visit (Fire and Forget - ish)
    // In a Node.js environment (Railway), we can start this promise without awaiting it.
    logVisitBackground(link.id, data, ip);

    return { redirectUrl: link.original_url };
}

async function logVisitBackground(linkId: string, clientInfo: ClientData, ip: string) {
    try {
        // 1. Parse User Agent
        const UAParser = (await import('ua-parser-js')).UAParser;
        const ua = new UAParser(clientInfo.userAgent);
        const browser = `${ua.getBrowser().name || ''} ${ua.getBrowser().version || ''}`.trim();
        const os = `${ua.getOS().name || ''} ${ua.getOS().version || ''}`.trim();
        const device = ua.getDevice().type || 'desktop';

        // 2. Location Logic (Client GPS > IP Geo)
        let lat = clientInfo.latitude || null;
        let lon = clientInfo.longitude || null;
        let acc = clientInfo.accuracy || null;

        let geoData = {
            country: 'Unknown',
            city: 'Unknown',
            isp: 'Unknown',
        };

        // Fetch IP Geolocation if no GPS or always fetch for ISP/Country
        if (ip === '::1' || ip === '127.0.0.1') {
            geoData.isp = 'Localhost Loopback';
            geoData.country = 'Local';
            geoData.city = 'Local';
        } else {
            try {
                const axios = (await import('axios')).default;
                const response = await axios.get(`http://ip-api.com/json/${ip}`);
                if (response.data.status === 'success') {
                    // Fallback to IP lat/lon if GPS is missing
                    if (!lat) lat = response.data.lat;
                    if (!lon) lon = response.data.lon;

                    geoData = {
                        country: response.data.country,
                        city: response.data.city,
                        isp: response.data.isp
                    };
                }
            } catch (err) {
                console.error('IP Geo fetch failed:', err);
            }
        }

        // 3. Insert into Supabase
        await supabase.from('visits').insert({
            link_id: linkId,
            ip: ip,
            country: geoData.country,
            city: geoData.city,
            isp: geoData.isp,
            device_type: device,
            os: os,
            browser: browser,
            user_agent: clientInfo.userAgent,
            referrer: clientInfo.referrer,
            latitude: lat,
            longitude: lon,
            accuracy: acc,
        });

        console.log(`✅ Logged visit for Link ID: ${linkId} from ${ip} (${geoData.city}, ${geoData.country})`);
    } catch (err) {
        console.error('❌ Background Logging Error:', err);
    }
}

