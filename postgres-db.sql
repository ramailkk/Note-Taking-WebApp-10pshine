-- USERS CREATION TABLE --
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Metadata
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,                         -- to track user activity
    is_active BOOLEAN DEFAULT TRUE,               -- useful for disabling accounts
    role VARCHAR(20) DEFAULT 'user',              -- e.g., user, admin, moderator
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);