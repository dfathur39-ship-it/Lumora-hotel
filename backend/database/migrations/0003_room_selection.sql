-- LUMORA HOTELS — migration 0003: "Choose your room" feature
-- Adds everything the dynamic room-selection UI and the admin Room
-- Management dashboard need: bed/capacity detail, discounts, badges,
-- toggleable facilities, per-unit availability, a normalized image
-- gallery, a flexible facility list, and multi-room bookings.
-- Safe to run against an existing database: every change is additive,
-- existing rows get sensible defaults, and no data is dropped.
-- Run: psql "$DATABASE_URL" -f database/migrations/0003_room_selection.sql

begin;

-- ROOMS: richer, admin-controlled attributes ---------------------------
alter table rooms
    add column if not exists bed_type          text not null default 'Queen Bed',
    add column if not exists bed_count         integer not null default 1 check (bed_count > 0),
    add column if not exists bedroom_count     integer not null default 1 check (bedroom_count > 0),
    add column if not exists max_adults        integer,
    add column if not exists max_children      integer not null default 0 check (max_children >= 0),
    add column if not exists discount_percent  integer not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
    add column if not exists badge             text not null default '',
    add column if not exists status            text not null default 'available'
                                                    check (status in ('available', 'hidden', 'maintenance')),
    add column if not exists breakfast         boolean not null default false,
    add column if not exists parking           boolean not null default false,
    add column if not exists wifi              boolean not null default false,
    add column if not exists total_units       integer not null default 1 check (total_units > 0),
    add column if not exists updated_at         timestamptz not null default now(),
    add column if not exists deleted_at         timestamptz;

-- Backfill max_adults from the existing capacity column, then enforce it.
update rooms set max_adults = capacity where max_adults is null;
alter table rooms alter column max_adults set not null;
alter table rooms add constraint rooms_max_adults_check check (max_adults > 0);

create index if not exists idx_rooms_status on rooms (status) where deleted_at is null;

-- ROOM IMAGES: ordered gallery per room, admin-managed ------------------
create table if not exists room_images (
    id             uuid primary key default uuid_generate_v4(),
    room_id        text not null references rooms (id) on delete cascade,
    image_url      text not null,
    is_primary     boolean not null default false,
    display_order  integer not null default 0,
    created_at     timestamptz not null default now()
);

create index if not exists idx_room_images_room_id on room_images (room_id, display_order);

-- ROOM FACILITIES: free-form facility list per room, admin-managed ------
create table if not exists room_facilities (
    id             uuid primary key default uuid_generate_v4(),
    room_id        text not null references rooms (id) on delete cascade,
    facility_name  text not null,
    icon           text not null default '',
    created_at     timestamptz not null default now()
);

create index if not exists idx_room_facilities_room_id on room_facilities (room_id);

-- BOOKINGS: a guest may reserve more than one unit of the same room type
alter table bookings
    add column if not exists rooms_count integer not null default 1 check (rooms_count > 0);

commit;
