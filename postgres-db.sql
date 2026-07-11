-- =====================================================================
--  Note-Taking-WebApp-10pshine — PostgreSQL Database Schema
-- =====================================================================
BEGIN;

-- Enables faster ILIKE '%keyword%' search used by the notes dashboard
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------
-- USERS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                  SERIAL PRIMARY KEY,
    username            VARCHAR(50)  UNIQUE NOT NULL,
    email               VARCHAR(100) UNIQUE NOT NULL,
    password_hash       TEXT NOT NULL,

    -- Email verification flow (authController.signup / verifyEmail / login)
    is_verified         BOOLEAN DEFAULT FALSE,
    verification_token  TEXT,

    -- Metadata
    joined_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login          TIMESTAMP,               -- updated on every login
    is_active           BOOLEAN DEFAULT TRUE,     -- for disabling accounts
    role                VARCHAR(20) DEFAULT 'user', -- e.g. user, admin, moderator
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username           ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email              ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users (verification_token);

-- ---------------------------------------------------------------------
-- NOTES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_name     VARCHAR(255) NOT NULL DEFAULT 'Untitled Note',
    content_html  TEXT DEFAULT '',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id    ON notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes (updated_at);
CREATE INDEX IF NOT EXISTS idx_notes_name_trgm  ON notes USING gin (note_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_notes_html_trgm  ON notes USING gin (content_html gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Keep users.updated_at fresh automatically (app never sets it itself)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Note: notes.updated_at is intentionally NOT auto-triggered here, because
-- notesModel.js already sets "updated_at = NOW()" explicitly on save/rename
-- queries. Adding a trigger too is harmless but redundant; left out to
-- match the app's existing behavior exactly.

COMMIT;
