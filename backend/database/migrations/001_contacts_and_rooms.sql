-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp TEXT,
    instagram TEXT,
    tiktok TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Create room_images table
CREATE TABLE IF NOT EXISTS room_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create room_facilities table
CREATE TABLE IF NOT EXISTS room_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS available INTEGER DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT 1;

-- Add index for active rooms
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- Add index for active contacts
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active);

-- Add contact_id to bookings (optional for future)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);
