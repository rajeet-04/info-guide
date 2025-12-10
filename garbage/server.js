require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const UAParser = require('ua-parser-js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Helper Functions ---

// Async background logger (Fire and Forget)
async function logVisit(linkId, clientInfo, ip) {
    try {
        // 1. Parse User Agent
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

        if (ip === '::1' || ip === '127.0.0.1') {
            geoData.isp = 'Localhost Loopback';
        } else {
            // Using ip-api.com (free tier, rate limited)
            try {
                const response = await axios.get(`http://ip-api.com/json/${ip}`);
                if (response.data.status === 'success') {
                    // Only fallback to IP lat/lon if GPS is missing
                    if (!lat) lat = response.data.lat;
                    if (!lon) lon = response.data.lon;

                    geoData = {
                        country: response.data.country,
                        city: response.data.city,
                        isp: response.data.isp
                    };
                }
            } catch (err) {
                console.error('IP Geo fetch failed:', err.message);
            }
        }

        // 3. Insert into Supabase
        const { error } = await supabase.from('visits').insert({
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
            accuracy: acc
        });

        if (error) console.error('Supabase Insert Error:', error.message);
        else console.log(`Logged visit for Link ID: ${linkId} from ${ip}`);

    } catch (err) {
        console.error('Background Logging Error:', err);
    }
}


// --- API Routes ---

// 1. Admin Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Simple query for "minimal" auth
    const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !data) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return a basic success token (in real app using JWT is better, simple flag here)
    res.json({ success: true, username: data.username });
});

// 2. Create Short Link
app.post('/api/links', async (req, res) => {
    const { shortCode, originalUrl } = req.body;

    // Validation
    if (!shortCode || !originalUrl) {
        return res.status(400).json({ error: 'Missing shortCode or originalUrl' });
    }

    const { data, error } = await supabase
        .from('links')
        .insert({ short_code: shortCode, original_url: originalUrl })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Code already exists' });
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, link: data });
});

// 3. Get All Links (for Dashboard)
app.get('/api/links', async (req, res) => {
    // Fetch links with a count of visits
    // Supabase join or separate queries. Simple separate for now to keep it standard.
    // Actually, .select('*, visits(count)') is powerful in Supabase

    const { data, error } = await supabase
        .from('links')
        .select(`
            *,
            visits (count)
        `)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Transform count array to number if needed
    const stats = data.map(link => ({
        ...link,
        clickCount: link.visits[0] ? link.visits[0].count : 0
    }));

    res.json(stats);
});

// 3.5 Get Link Stats (Detailed Visits)
app.get('/api/links/:linkId/stats', async (req, res) => {
    const { linkId } = req.params;

    const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to last 50 for performance

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});


// 4. Verify & Redirect (The Core Feature)
app.post('/verify', async (req, res) => {
    const { shortCode, ...clientInfo } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // A. Resolve Link
    const { data: link, error } = await supabase
        .from('links')
        .select('id, original_url')
        .eq('short_code', shortCode)
        .single();

    if (error || !link) {
        // Fallback to google or error page
        return res.json({ redirectUrl: 'https://www.google.com' });
    }

    // B. IMMEDIATE RESPONSE (Fire and Forget)
    res.json({ redirectUrl: link.original_url });

    // C. Background Processing
    // We don't await this, letting the event loop handle it
    logVisit(link.id, clientInfo, ip);
});


// Admin Route override
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- Wildcard Route for Serving Interstitial ---
// Any route not caught by api/admin will be served the index.html
// The frontend will then parse the URL to extract the "code"
app.get('/:code', (req, res) => {
    if (req.params.code.startsWith('api')) return res.status(404).end(); // Safety
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// (Moved above)


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
