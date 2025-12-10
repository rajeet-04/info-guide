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
        // 1. Parse User Agent with detailed device info
        const UAParser = (await import('ua-parser-js')).UAParser;
        const ua = new UAParser(clientInfo.userAgent);

        const browserInfo = ua.getBrowser();
        const osInfo = ua.getOS();
        const deviceInfo = ua.getDevice();

        const browser = `${browserInfo.name || ''} ${browserInfo.version || ''}`.trim();
        const os = `${osInfo.name || ''} ${osInfo.version || ''}`.trim();

        // Build detailed device string
        const deviceType = deviceInfo.type || 'desktop';
        const deviceVendor = deviceInfo.vendor || '';
        const deviceModel = deviceInfo.model || '';

        // Create a descriptive device string
        let deviceString: string = deviceType;
        if (deviceVendor || deviceModel) {
            const parts = [deviceVendor, deviceModel].filter(Boolean);
            deviceString = parts.join(' ') || deviceType;
        }

        console.log(`📱 Device parsed:`, {
            type: deviceType,
            vendor: deviceVendor,
            model: deviceModel,
            combined: deviceString,
            browser,
            os
        });

        // 2. Clean IP address (handle proxy chains and IPv6)
        // x-forwarded-for can be: "client, proxy1, proxy2"
        let cleanIp = ip.split(',')[0].trim();

        // Strip IPv6-to-IPv4 mapping prefix (::ffff:192.168.1.1 -> 192.168.1.1)
        if (cleanIp.startsWith('::ffff:')) {
            cleanIp = cleanIp.substring(7);
        }

        // Handle IPv6 localhost
        if (cleanIp === '::1') cleanIp = '127.0.0.1';

        console.log(`🔍 Processing visit - IP: ${cleanIp}, Link: ${linkId}`);

        // Helper to check if IP is private/local
        const isPrivateIP = (ipAddr: string): boolean => {
            if (ipAddr === '127.0.0.1' || ipAddr === 'localhost') return true;
            if (ipAddr.startsWith('192.168.')) return true;
            if (ipAddr.startsWith('10.')) return true;
            if (ipAddr.startsWith('172.')) {
                const secondOctet = parseInt(ipAddr.split('.')[1]);
                if (secondOctet >= 16 && secondOctet <= 31) return true;
            }
            return false;
        };

        // 3. Location Logic (Client GPS > IP Geo)
        let lat = clientInfo.latitude || null;
        let lon = clientInfo.longitude || null;
        let acc = clientInfo.accuracy || null;

        let geoData: {
            country: string | null;
            city: string | null;
            isp: string | null;
        } = {
            country: null,
            city: null,
            isp: null,
        };

        // Fetch IP Geolocation (always try, even if GPS exists, for ISP/Country data)
        if (isPrivateIP(cleanIp)) {
            geoData.isp = 'Private Network';
            geoData.country = 'Local';
            geoData.city = 'Local';
            console.log('ℹ️ Private/Local IP detected, skipping geolocation API');
        } else {
            try {
                const axios = (await import('axios')).default;
                const geoUrl = `http://ip-api.com/json/${cleanIp}?fields=status,message,country,city,lat,lon,isp,query`;

                console.log(`🌍 Fetching geo data from: ${geoUrl}`);

                const response = await axios.get(geoUrl, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; LinkShortener/1.0)'
                    }
                });

                console.log(`📍 Geo API response:`, response.data);

                if (response.data.status === 'success') {
                    // Fallback to IP lat/lon if GPS is missing
                    if (!lat && response.data.lat) lat = response.data.lat;
                    if (!lon && response.data.lon) lon = response.data.lon;

                    geoData = {
                        country: response.data.country || null,
                        city: response.data.city || null,
                        isp: response.data.isp || null
                    };

                    console.log(`✅ Geo data retrieved: ${geoData.city}, ${geoData.country}`);
                } else {
                    console.error(`⚠️ Geo API returned error: ${response.data.message || 'Unknown error'}`);
                }
            } catch (err: any) {
                console.error('❌ IP Geo fetch failed:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
            }
        }

        // 4. Insert into Supabase
        const visitData = {
            link_id: linkId,
            ip: cleanIp,
            country: geoData.country,
            city: geoData.city,
            isp: geoData.isp,
            device_type: deviceString,
            os: os || null,
            browser: browser || null,
            user_agent: clientInfo.userAgent,
            referrer: clientInfo.referrer || null,
            latitude: lat,
            longitude: lon,
            accuracy: acc,
        };

        console.log('💾 Inserting visit data:', visitData);

        const { error: insertError } = await supabase.from('visits').insert(visitData);

        if (insertError) {
            console.error('❌ Supabase insert error:', insertError);
        } else {
            console.log(`✅ Visit logged successfully - Link: ${linkId}, IP: ${cleanIp}, Location: ${geoData.city}, ${geoData.country}`);
        }
    } catch (err: any) {
        console.error('❌ Background Logging Error:', {
            message: err.message,
            stack: err.stack
        });
    }
}
