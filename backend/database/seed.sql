-- LUMORA HOTELS — seed data
-- Mirrors the hotel/room catalogue used in the frontend's local fallback data
-- (src/data/hotels.ts), so API responses and the frontend UI stay in sync.
-- Run after schema.sql: psql $DATABASE_URL -f database/seed.sql

insert into hotels (id, name, location, description, image, gallery, rating, price_from, amenities) values
('azure-palm', 'The Azure Palm', 'Uluwatu, Bali',
 'Cliffside villas overlooking the Indian Ocean, framed by infinity pools and palm-shaded terraces.',
 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80'
 ], 4.9, 480, array['Infinity Pool','Spa','Private Beach Access','Ocean View']),

('grand-aurelia', 'The Grand Aurelia', 'Paris, France',
 'A Belle Époque landmark reimagined with contemporary elegance, steps from the Champs-Élysées.',
 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80'
 ], 4.8, 620, array['Michelin Dining','Rooftop Bar','Concierge','Valet Parking']),

('montis-retreat', 'Montis Retreat', 'Zermatt, Swiss Alps',
 'A timber-and-stone alpine sanctuary with Matterhorn views and a cedar-lined spa.',
 'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1548704806-38a3a2050c04?auto=format&fit=crop&w=1200&q=80'
 ], 4.9, 710, array['Ski-in/Ski-out','Alpine Spa','Fireplace Suites','Mountain View']),

('ocean-pearl-resort', 'Ocean Pearl Resort', 'North Malé Atoll, Maldives',
 'Overwater bungalows above turquoise lagoons, with glass floor panels open to coral gardens below.',
 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80'
 ], 5.0, 980, array['Overwater Villa','Private Lagoon','Snorkeling','Butler Service']),

('noir-tokyo', 'Noir Tokyo', 'Shinjuku, Tokyo',
 'A minimalist high-rise retreat above the neon skyline, where washi-paper light meets skyline views.',
 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1200&q=80'
 ], 4.7, 390, array['Skyline View','Onsen Bath','Omakase Dining','City Center']),

('casa-verde', 'Casa Verde', 'Tulum, Mexico',
 'A jungle-wrapped eco-retreat with open-air suites, cenote access, and barefoot luxury.',
 'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&w=1200&q=80'
 ], 4.6, 320, array['Cenote Access','Yoga Deck','Eco Design','Jungle View']),

('aurora-heights', 'Aurora Heights', 'Reykjavík, Iceland',
 'Glass-domed suites for aurora watching, warmed by geothermal pools and volcanic-stone interiors.',
 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1518623001395-125242310d0c?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1200&q=80'
 ], 4.8, 540, array['Geothermal Pool','Glass-Roof Suite','Northern Lights View','Sauna']),

('velvet-sands', 'Velvet Sands', 'Positano, Amalfi Coast',
 'Pastel-terraced suites cascading toward the sea, with a private cove and lemon-grove dining.',
 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80'
 ], 4.9, 590, array['Private Cove','Terrace Dining','Sea View','Boat Excursions']),

('the-meridian', 'The Meridian', 'Manhattan, New York',
 'An Art Deco tower reborn as a residence for the discerning traveler, overlooking Central Park.',
 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80'
 ], 4.7, 450, array['Park View','Rooftop Lounge','Business Center','Fitness Studio']),

('elysian-cove', 'Elysian Cove', 'Santorini, Greece',
 'Whitewashed cave suites carved into the caldera, with private plunge pools facing the sunset.',
 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1200&q=80',
 array[
   'https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
   'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80'
 ], 5.0, 670, array['Caldera View','Private Plunge Pool','Sunset Terrace','Wine Cellar'])
on conflict (id) do nothing;

-- ROOMS -----------------------------------------------------------------
-- Three tiers per hotel: Deluxe Room, Ocean View Suite, Presidential Suite,
-- priced at 1x / 1.5x / 2.4x the hotel's price_from — matching the
-- frontend's local fallback generation logic exactly.
insert into rooms (id, hotel_id, name, description, price, capacity, size, image, amenities)
select
  h.id || '-deluxe', h.id, 'Deluxe Room',
  'A refined retreat with curated furnishings and a private balcony.',
  h.price_from, 2, 32, h.gallery[1],
  array['King Bed','Free Wi-Fi','Minibar','Balcony']
from hotels h
on conflict (id) do nothing;

insert into rooms (id, hotel_id, name, description, price, capacity, size, image, amenities)
select
  h.id || '-ocean-suite', h.id, 'Ocean View Suite',
  'An expansive suite with panoramic views and a soaking tub.',
  round(h.price_from * 1.5)::int, 3, 52, h.gallery[2],
  array['King Bed','Soaking Tub','Lounge Area','Ocean View']
from hotels h
on conflict (id) do nothing;

insert into rooms (id, hotel_id, name, description, price, capacity, size, image, amenities)
select
  h.id || '-presidential', h.id, 'Presidential Suite',
  'The pinnacle of the property — a private terrace, dining room, and butler service.',
  round(h.price_from * 2.4)::int, 4, 90, h.gallery[3],
  array['Private Terrace','Butler Service','Dining Room','Panoramic View']
from hotels h
on conflict (id) do nothing;

-- Demo admin account — the password_hash placeholder below is NOT a real
-- bcrypt hash for any known password. Generate your own before using this
-- account, e.g. from the backend directory:
--   go run -exec "" ./... 2>/dev/null  # or a small one-off script that calls
--   bcrypt.GenerateFromPassword([]byte("your-password"), bcrypt.DefaultCost)
-- then paste the resulting hash below, or simply register normally through
-- POST /api/auth/register and promote the account to 'admin' via SQL:
--   update users set role = 'admin' where email = 'admin@lumorahotels.com';
insert into users (id, name, email, password_hash, role)
values (
  uuid_generate_v4(), 'Lumora Admin', 'admin@lumorahotels.com',
  'REPLACE_WITH_REAL_BCRYPT_HASH',
  'admin'
)
on conflict (email) do nothing;
