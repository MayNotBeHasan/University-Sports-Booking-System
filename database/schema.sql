CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT users_role_check
        CHECK (role IN ('STUDENT', 'ADMIN')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sport VARCHAR(50) NOT NULL,
    location VARCHAR(150) NOT NULL,
    capacity INTEGER NOT NULL,

    CONSTRAINT facilities_capacity_check
        CHECK (capacity > 0)
);

CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL,

    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    CONSTRAINT slots_facility_fk
        FOREIGN KEY (facility_id)
        REFERENCES facilities(id)
        ON DELETE CASCADE,

    CONSTRAINT slots_time_check
        CHECK (end_time > start_time),

    CONSTRAINT slots_unique_time
        UNIQUE (facility_id, start_time, end_time)
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,

    CONSTRAINT bookings_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT bookings_slot_fk
        FOREIGN KEY (slot_id)
        REFERENCES slots(id)
        ON DELETE CASCADE,

    CONSTRAINT bookings_status_check
        CHECK (status IN ('CONFIRMED', 'CANCELLED')),

    CONSTRAINT bookings_cancel_time_check
        CHECK (
            (status = 'CONFIRMED' AND cancelled_at IS NULL)
            OR
            (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
        )
);

CREATE UNIQUE INDEX unique_confirmed_booking_per_slot
ON bookings (slot_id)
WHERE status = 'CONFIRMED';
