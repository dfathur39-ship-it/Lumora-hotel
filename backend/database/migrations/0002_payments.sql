-- LUMORA HOTELS — migration 0002: payment fields on bookings
-- Safe to run against an existing database: every change is additive,
-- existing rows get sensible defaults, and no data is dropped.
-- Run: psql "$DATABASE_URL" -f database/migrations/0002_payments.sql
-- (or paste into the Supabase SQL editor)

begin;

-- New payment-related columns. All nullable or defaulted so existing
-- bookings remain valid without a backfill step blocking the migration.
alter table bookings
    add column if not exists booking_code        text,
    add column if not exists payment_method       text not null default 'pay_at_hotel',
    add column if not exists payment_status       text not null default 'unpaid',
    add column if not exists payment_provider     text,
    add column if not exists transaction_id       text,
    add column if not exists paid_at              timestamptz,
    add column if not exists payment_expires_at   timestamptz;

-- Backfill a human-readable booking code for rows created before this
-- migration (e.g. LUM-20260101-3F9A2C), then enforce it going forward.
update bookings
set booking_code = 'LUM-' || to_char(created_at, 'YYYYMMDD') || '-' || upper(substr(id::text, 1, 6))
where booking_code is null;

alter table bookings alter column booking_code set not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'bookings_booking_code_key'
    ) then
        alter table bookings add constraint bookings_booking_code_key unique (booking_code);
    end if;
end $$;

-- Booking status previously only allowed confirmed/cancelled/completed.
-- 'pending' is added for bookings awaiting an online payment (QRIS, card,
-- PayPal) that hasn't completed yet.
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check
    check (status in ('pending', 'confirmed', 'cancelled', 'completed'));

alter table bookings drop constraint if exists bookings_payment_method_check;
alter table bookings add constraint bookings_payment_method_check
    check (payment_method in ('qris', 'card_bca', 'paypal', 'pay_at_hotel'));

alter table bookings drop constraint if exists bookings_payment_status_check;
alter table bookings add constraint bookings_payment_status_check
    check (payment_status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'unpaid'));

create index if not exists idx_bookings_payment_status on bookings (payment_status);
create index if not exists idx_bookings_booking_code on bookings (booking_code);
create index if not exists idx_bookings_transaction_id on bookings (transaction_id);

commit;
