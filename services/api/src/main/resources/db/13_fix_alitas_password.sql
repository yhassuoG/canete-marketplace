-- Fix: Update alitas@demo.com password hash to a valid BCrypt hash for "demo123"
-- The original seed hash ($2a$12$...) was not validating correctly with BCryptPasswordEncoder (strength 10).
SET search_path TO canete_marketplace, public;

UPDATE users
SET password_hash = '$2a$10$EDgHQJwoL2SiVxvmjdNzmeXEHiuVTqkX2UZy8ZNwzYC9HMem0YhmC',
    updated_at = now()
WHERE email = 'alitas@demo.com';
