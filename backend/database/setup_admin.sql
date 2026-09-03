-- Script untuk setup database dan membuat user admin
-- Jalankan dengan: psql $DATABASE_URL -f backend/database/setup_admin.sql

-- Pastikan tabel password_reset_tokens sudah ada
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              uuid primary key default uuid_generate_v4(),
    user_id         uuid not null references users (id) on delete cascade,
    token           text not null unique,
    approved_by     uuid references users (id) on delete set null,
    status          text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'used', 'expired')),
    requested_at    timestamptz not null default now(),
    approved_at     timestamptz,
    expires_at      timestamptz not null,
    used_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_status ON password_reset_tokens (status);

-- Buat user admin untuk testing
-- Password: admin123 (bcrypt hash)
INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES (
    uuid_generate_v4(),
    'Admin LUMORA',
    'admin@lumora.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: admin123
    'admin',
    now()
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin'
WHERE users.email = 'admin@lumora.com';

-- Tampilkan user admin yang dibuat
SELECT id, name, email, role, created_at
FROM users
WHERE role = 'admin';
