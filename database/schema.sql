CREATE TABLE IF NOT EXISTS users(
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS theatres(
    id BIGSERIAL PRIMARY KEY,
    theatre_name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS screens(
    id BIGSERIAL PRIMARY KEY,
    theatre_id BIGINT  REFERENCES theatres(id) ON DELETE CASCADE,
    screen_name VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL,
    total_columns INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE IF NOT EXISTS movies(
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    release_date DATE NOT NULL,
    movie_language VARCHAR(255) NOT NULL,
    movie_description TEXT,
    poster_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()

);
CREATE TABLE IF NOT EXISTS shows (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT REFERENCES movies(id) ,
    screen_id BIGINT REFERENCES screens(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled',
    base_price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (status IN ('scheduled','cancelled','completed','housefull'))
);

CREATE TABLE IF NOT EXISTS seats (
    id BIGSERIAL PRIMARY KEY,
    screen_id BIGINT REFERENCES screens(id) ON DELETE CASCADE,
    row_label VARCHAR(5) NOT NULL,
    seat_no INT NOT NULL,
    seat_type VARCHAR(30) DEFAULT 'regular',
    base_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (screen_id, row_label, seat_no)
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    show_id BIGINT REFERENCES shows(id),
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    CHECK (status IN ('pending','confirmed','cancelled','expired'))
);

CREATE TABLE IF NOT EXISTS booking_seats (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id BIGINT REFERENCES seats(id),
    show_id BIGINT REFERENCES shows(id),
    price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (show_id, seat_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES bookings(id),
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(255),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'initiated',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (status IN ('initiated','success','failed','refunded'))
);