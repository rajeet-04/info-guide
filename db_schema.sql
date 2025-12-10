-- Create Admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Storing plain text as requested for "minimal", but hashing is recommended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Links table
CREATE TABLE IF NOT EXISTS links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Visits table with detailed logging columns
CREATE TABLE IF NOT EXISTS visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE,
    ip TEXT,
    country TEXT,
    city TEXT,
    isp TEXT,
    device_type TEXT,
    os TEXT,
    browser TEXT,
    user_agent TEXT,
    referrer TEXT,
    latitude FLOAT,
    longitude FLOAT,
    accuracy FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed an initial admin user (Change password immediately if used in production)
-- Username: admin, Password: password123
INSERT INTO admins (username, password) 
VALUES ('admin', 'password123')
ON CONFLICT (username) DO NOTHING;
