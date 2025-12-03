CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- seeker / employer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
