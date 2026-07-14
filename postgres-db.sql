-- Consolidated Postgres schema for cloudproj, for Supabase.
-- The original repo only had a partial `users` table checked in (root
-- postgres-db.sql) plus a handful of incremental Azure-SQL migration files
-- (backend/migrations/*.sql) for columns added later, and no CREATE TABLE
-- statements at all for notes/notebooks/tasks. This consolidates all of it
-- into one Postgres-native schema reflecting every column the converted
-- models/handlers actually read or write.

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    profile_picture TEXT,
    graph_meta_data TEXT
);

CREATE TABLE notebooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notebook_name VARCHAR(255) NOT NULL DEFAULT 'New Notebook',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notebook_id INTEGER REFERENCES notebooks(id) ON DELETE SET NULL,
    note_name VARCHAR(255) DEFAULT 'Untitled Note',
    content_html TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    is_protected BOOLEAN DEFAULT FALSE,
    encryption_iv VARCHAR(64)
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_notebook_id ON notes(notebook_id);
CREATE INDEX idx_notes_protected ON notes(is_protected);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_text VARCHAR(500) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
