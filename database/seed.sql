-- ============================================
-- University Sports Booking - Large Seed Data
-- ============================================

-- Add 20 more facilities
INSERT INTO facilities (name, sport, location, capacity)
SELECT
    'Facility ' || gs,
    CASE
        WHEN gs % 5 = 0 THEN 'Cricket'
        WHEN gs % 5 = 1 THEN 'Football'
        WHEN gs % 5 = 2 THEN 'Volleyball'
        WHEN gs % 5 = 3 THEN 'Badminton'
        ELSE 'Table Tennis'
    END,
    CASE
        WHEN gs % 2 = 0 THEN 'Indoor Sports Hall'
        ELSE 'University Sports Complex'
    END,
    4 + (gs % 20)
FROM generate_series(7, 26) AS gs
ON CONFLICT DO NOTHING;


-- Add 100 users
INSERT INTO users (name, email, password_hash, role)
SELECT
    'Seed User ' || gs,
    'seeduser' || gs || '@university.edu',
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    'STUDENT'
FROM generate_series(1, 100) AS gs
ON CONFLICT (email) DO NOTHING;


-- Generate slots for all facilities
INSERT INTO slots (facility_id, start_time, end_time)
SELECT
    f.id,
    d.day + t.start_time,
    d.day + t.start_time + INTERVAL '1 hour'
FROM facilities f
CROSS JOIN generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    INTERVAL '1 day'
) AS d(day)
CROSS JOIN (
    VALUES
        (TIME '09:00'),
        (TIME '10:00'),
        (TIME '11:00'),
        (TIME '15:00'),
        (TIME '16:00'),
        (TIME '17:00'),
        (TIME '18:00'),
        (TIME '19:00')
) AS t(start_time)
ON CONFLICT (facility_id, start_time, end_time) DO NOTHING;


-- Generate 5,000 booking-history records
-- Only create bookings against slots that are currently unused.
INSERT INTO bookings (user_id, slot_id, status, created_at, cancelled_at)
SELECT
    1 + ((gs - 1) % 100),
    s.id,
    'CANCELLED',
    NOW() - ((gs % 365) || ' days')::INTERVAL,
    NOW() - ((gs % 300) || ' days')::INTERVAL
FROM generate_series(1, 5000) AS gs
JOIN LATERAL (
    SELECT id
    FROM slots
    ORDER BY id
    OFFSET ((gs - 1) % (SELECT COUNT(*) FROM slots))
    LIMIT 1
) s ON true;