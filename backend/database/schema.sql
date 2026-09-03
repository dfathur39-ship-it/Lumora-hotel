-- LUMORA HOTELS — Supabase PostgreSQL schema
-- Run in the Supabase SQL editor, or via `psql $DATABASE_URL -f database/schema.sql`

create extension if not exists "uuid-ossp";

-- USERS ---------------------------------------------------------------
create table if not exists users (
    id            uuid primary key default uuid_generate_v4(),
    name          text not null,
    email         text not null unique,
    password_hash text not null,
    role          text not null default 'user' check (role in ('user', 'admin')),
    created_at    timestamptz not null default now()
);

create index if not exists idx_users_email on users (email);

-- HOTELS ----------------------------------------------------------------
create table if not exists hotels (
    id          text primary key,
    name        text not null,
    location    text not null,
    description text not null,
    image       text not null,
    gallery     text[] not null default '{}',
    rating      numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
    price_from  integer not null check (price_from >= 0),
    amenities   text[] not null default '{}',
    created_at  timestamptz not null default now()
);

create index if not exists idx_hotels_location on hotels (location);
create index if not exists idx_hotels_rating on hotels (rating desc);

-- ROOMS -------------------------------------------------------------
create table if not exists rooms (
    id                text primary key,
    hotel_id          text not null references hotels (id) on delete cascade,
    name              text not null,
    description       text not null,
    price             integer not null check (price >= 0),
    capacity          integer not null check (capacity > 0),
    size              integer not null check (size > 0),
    image             text not null,
    amenities         text[] not null default '{}',
    bed_type          text not null default 'Queen Bed',
    bed_count         integer not null default 1 check (bed_count > 0),
    bedroom_count     integer not null default 1 check (bedroom_count > 0),
    max_adults        integer not null check (max_adults > 0),
    max_children      integer not null default 0 check (max_children >= 0),
    discount_percent  integer not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
    badge             text not null default '',
    status            text not null default 'available'
                          check (status in ('available', 'hidden', 'maintenance')),
    breakfast         boolean not null default false,
    parking           boolean not null default false,
    wifi              boolean not null default false,
    total_units       integer not null default 1 check (total_units > 0),
    updated_at        timestamptz not null default now(),
    deleted_at        timestamptz
);

create index if not exists idx_rooms_hotel_id on rooms (hotel_id);
create index if not exists idx_rooms_status on rooms (status) where deleted_at is null;

-- ROOM IMAGES ---------------------------------------------------------
create table if not exists room_images (
    id             uuid primary key default uuid_generate_v4(),
    room_id        text not null references rooms (id) on delete cascade,
    image_url      text not null,
    is_primary     boolean not null default false,
    display_order  integer not null default 0,
    created_at     timestamptz not null default now()
);

create index if not exists idx_room_images_room_id on room_images (room_id, display_order);

-- ROOM FACILITIES -------------------------------------------------------
create table if not exists room_facilities (
    id             uuid primary key default uuid_generate_v4(),
    room_id        text not null references rooms (id) on delete cascade,
    facility_name  text not null,
    icon           text not null default '',
    created_at     timestamptz not null default now()
);

create index if not exists idx_room_facilities_room_id on room_facilities (room_id);

-- BOOKINGS ----------------------------------------------------------
create table if not exists bookings (
    id                   uuid primary key default uuid_generate_v4(),
    booking_code         text not null unique,
    user_id              uuid not null references users (id) on delete cascade,
    hotel_id             text not null references hotels (id) on delete restrict,
    room_id              text not null references rooms (id) on delete restrict,
    check_in             date not null,
    check_out            date not null,
    guests               integer not null check (guests > 0),
    guest_name           text not null,
    guest_email          text not null,
    guest_phone          text not null default '',
    nights               integer not null check (nights > 0),
    total                integer not null check (total >= 0),
    rooms_count          integer not null default 1 check (rooms_count > 0),
    status               text not null default 'confirmed'
                             check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_method       text not null default 'pay_at_hotel'
                             check (payment_method in ('qris', 'card_bca', 'paypal', 'pay_at_hotel')),
    payment_status       text not null default 'unpaid'
                             check (payment_status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'unpaid')),
    payment_provider     text,
    transaction_id       text,
    paid_at              timestamptz,
    payment_expires_at   timestamptz,
    created_at           timestamptz not null default now(),
    constraint valid_date_range check (check_out > check_in)
);

create index if not exists idx_bookings_user_id on bookings (user_id);
create index if not exists idx_bookings_hotel_id on bookings (hotel_id);
create index if not exists idx_bookings_status on bookings (status);
create index if not exists idx_bookings_payment_status on bookings (payment_status);
create index if not exists idx_bookings_booking_code on bookings (booking_code);
create index if not exists idx_bookings_transaction_id on bookings (transaction_id);

-- FAVORITES -----------------------------------------------------------
create table if not exists favorites (
    user_id    uuid not null references users (id) on delete cascade,
    hotel_id   text not null references hotels (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, hotel_id)
);

-- REVIEWS -------------------------------------------------------------
create table if not exists reviews (
    id         uuid primary key default uuid_generate_v4(),
    hotel_id   text not null references hotels (id) on delete cascade,
    user_id    uuid not null references users (id) on delete cascade,
    rating     numeric(2,1) not null check (rating >= 1 and rating <= 5),
    comment    text not null default '',
    created_at timestamptz not null default now(),
    unique (hotel_id, user_id)
);

create index if not exists idx_reviews_hotel_id on reviews (hotel_id);

-- PASSWORD RESET TOKENS -----------------------------------------------
create table if not exists password_reset_tokens (
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

create index if not exists idx_password_reset_tokens_user_id on password_reset_tokens (user_id);
create index if not exists idx_password_reset_tokens_token on password_reset_tokens (token);
create index if not exists idx_password_reset_tokens_status on password_reset_tokens (status);
