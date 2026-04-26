INSERT INTO users (username, email, password_hash, is_verified, role) VALUES
('Sakshi', 'sakshi@example.com', '$2b$10$i15GSYgePjZaZKtPJ718Aum1GPgZu.gU/c857Y1zH6lyMPC406u3.', true, 'admin'),
('Riya', 'riya@example.com', '$2b$10$fcl/Ugss2tpKdGRfGmD4OOpWCv9Q0KElBAb5t/iH63pwD2DyAumm.', true, 'user');

INSERT INTO theatres (theatre_name, city, address) VALUES
('PVR Cinemas', 'Mumbai', '123 Main Street, Mumbai'),
('INOX', 'Delhi', '456 Park Avenue, Delhi');

INSERT INTO screens (theatre_id, screen_name, total_rows, total_columns) VALUES
(1, 'Screen 1', 10, 20),
(1, 'Screen 2', 8, 15),
(2, 'Screen A', 12, 25);

INSERT INTO movies (title, genre, duration_minutes, release_date, movie_language, movie_description, poster_url) VALUES
('Inception', 'Sci-Fi', 148, '2010-07-16', 'English',
'A thief who steals corporate secrets through dream-sharing technology.',
'https://m.media-amazon.com/images/M/MV5BZjhkNjM0ZTMtNGM5MC00ZTQ3LTk3YmYtZTkzYzdiNWE0ZTA2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'),

('3 Idiots', 'Comedy/Drama', 170, '2009-12-25', 'Hindi',
'Two friends search for their long lost companion.',
'https://m.media-amazon.com/images/M/MV5BNzc4ZWQ3NmYtODE0Ny00YTQ4LTlkZWItNTBkMGQ0MmUwMmJlXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg');

INSERT INTO shows (movie_id, screen_id, start_time, end_time, status, base_price) VALUES
(1, 1, '2026-04-15 18:00:00', '2026-04-15 20:30:00', 'scheduled', 300.00),
(2, 2, '2026-04-15 19:00:00', '2026-04-15 22:00:00', 'scheduled', 250.00);

INSERT INTO seats (screen_id, row_label, seat_no, seat_type, base_price) VALUES
(1, 'A', 1, 'regular', 300),
(1, 'A', 2, 'regular', 300),
(1, 'B', 1, 'premium', 500),
(2, 'A', 1, 'regular', 250),
(2, 'A', 2, 'regular', 250),
(3, 'A', 1, 'premium', 600);

