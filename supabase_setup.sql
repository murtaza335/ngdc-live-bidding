-- NGDC HOUSE DRAFT 2026 - Database Schema & Seed Data
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- 0. CLEAN UP EXISTING TABLES (if re-running)
-- ============================================
DROP TABLE IF EXISTS bids_log CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS houses CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ============================================
-- 1. HOUSES TABLE (MUST be created FIRST)
-- ============================================
CREATE TABLE houses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ob_lead TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  initial_credits INT DEFAULT 20,
  remaining_credits INT DEFAULT 20
);

-- ============================================
-- 2. CANDIDATES TABLE (references houses)
-- ============================================
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  real_name TEXT NOT NULL,
  track TEXT NOT NULL CHECK (track IN ('Programmer', '2D Artist', '3D Artist', 'Game Designer')),
  score INT NOT NULL CHECK (score BETWEEN 3 AND 15),
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'image', 'pdf')),
  media_url TEXT NOT NULL,
  pitch TEXT NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'bidding', 'drafted')),
  drafted_to_house_id TEXT REFERENCES houses(id),
  winning_bid INT DEFAULT 0,
  anonymous_id TEXT,
  avatar_url TEXT,
  contact TEXT
);

-- ============================================
-- 3. BIDS LOG TABLE (references both)
-- ============================================
CREATE TABLE bids_log (
  id BIGSERIAL PRIMARY KEY,
  candidate_id TEXT REFERENCES candidates(id),
  house_id TEXT REFERENCES houses(id),
  bid_amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. SETTINGS TABLE (persisted app/UI state, e.g. current phase)
-- ============================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================
-- 5. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE houses;
ALTER PUBLICATION supabase_realtime ADD TABLE bids_log;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;

-- ============================================
-- 6. ROW LEVEL SECURITY (public access)
-- ============================================
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on houses" ON houses FOR SELECT USING (true);
CREATE POLICY "Allow public read access on candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Allow public read access on bids_log" ON bids_log FOR SELECT USING (true);
CREATE POLICY "Allow public read access on settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on bids_log" ON bids_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on candidates" ON candidates FOR UPDATE USING (true);
CREATE POLICY "Allow public update on houses" ON houses FOR UPDATE USING (true);
CREATE POLICY "Allow public upsert on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 7. SEED DATA
-- ============================================
INSERT INTO settings (key, value) VALUES ('phase', 'phase1');

INSERT INTO houses (id, name, ob_lead, color_hex, initial_credits, remaining_credits) VALUES
('house-1', 'House Alpha', 'Alex Chen', '#3B82F6', 20, 20),
('house-2', 'House Bravo', 'Samira Khan', '#A855F7', 20, 20),
('house-3', 'House Crimson', 'Miguel Rodriguez', '#EF4444', 20, 20),
('house-4', 'House Emerald', 'Priya Sharma', '#10B981', 20, 20),
('house-5', 'House Amber', 'James Wilson', '#FFB800', 20, 20);

INSERT INTO candidates (id, real_name, track, score, media_type, media_url, pitch, status, drafted_to_house_id, winning_bid, anonymous_id, avatar_url, contact) VALUES
('cand-01', 'Zainab Khan', 'Programmer', 14, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Building immersive WebGL experiences with dynamic lighting and particle systems.', 'available', NULL, 0, 'CANDIDATE #01', 'https://i.pravatar.cc/150?img=1', 'zainab.khan@student.nust.edu.pk'),
('cand-02', 'Rohan Patel', '2D Artist', 12, 'image', 'https://picsum.photos/seed/art2d/800/600', 'Pixel-perfect UI art with a focus on retro-futuristic aesthetics.', 'available', NULL, 0, 'CANDIDATE #02', 'https://i.pravatar.cc/150?img=2', 'rohan.patel@student.nust.edu.pk'),
('cand-03', 'Fatima Ali', '3D Artist', 15, 'image', 'https://picsum.photos/seed/art3d/800/600', 'Creating hyper-realistic game assets with PBR workflows and sculpt-to-print pipelines.', 'available', NULL, 0, 'CANDIDATE #03', 'https://i.pravatar.cc/150?img=3', 'fatima.ali@student.nust.edu.pk'),
('cand-04', 'Umar Farooq', 'Game Designer', 11, 'pdf', 'https://example.com/design-document.pdf', 'Designing compelling gameplay loops that keep players engaged for hours.', 'available', NULL, 0, 'CANDIDATE #04', 'https://i.pravatar.cc/150?img=4', 'umar.farooq@student.nust.edu.pk'),
('cand-05', 'Ayesha Siddiqui', 'Programmer', 13, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Specializing in multiplayer networking and real-time state synchronization.', 'available', NULL, 0, 'CANDIDATE #05', 'https://i.pravatar.cc/150?img=5', 'ayesha.siddiqui@student.nust.edu.pk'),
('cand-06', 'Hassan Raza', '2D Artist', 9, 'image', 'https://picsum.photos/seed/concept/800/600', 'Concept artist passionate about character design and world-building.', 'available', NULL, 0, 'CANDIDATE #06', 'https://i.pravatar.cc/150?img=6', 'hassan.raza@student.nust.edu.pk'),
('cand-07', 'Maria Ali', '3D Artist', 10, 'image', 'https://picsum.photos/seed/env3d/800/600', 'Environmental 3D artist focused on creating immersive game worlds.', 'available', NULL, 0, 'CANDIDATE #07', 'https://i.pravatar.cc/150?img=7', 'maria.ali@student.nust.edu.pk'),
('cand-08', 'Ali Hussain', 'Programmer', 8, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'VR enthusiast building next-gen immersive experiences.', 'available', NULL, 0, 'CANDIDATE #08', 'https://i.pravatar.cc/150?img=8', 'ali.hussain@student.nust.edu.pk'),
('cand-09', 'Sanaullah Khan', 'Game Designer', 7, 'pdf', 'https://example.com/game-design-doc.pdf', 'Narrative designer crafting emotional player journeys through choice and consequence.', 'available', NULL, 0, 'CANDIDATE #09', 'https://i.pravatar.cc/150?img=9', 'sanaullah.khan@student.nust.edu.pk'),
('cand-10', 'Iqra Tahir', '2D Artist', 6, 'image', 'https://picsum.photos/seed/uiux/800/600', 'UI/UX designer focused on intuitive game interfaces and accessibility.', 'available', NULL, 0, 'CANDIDATE #10', 'https://i.pravatar.cc/150?img=10', 'iqra.tahir@student.nust.edu.pk');

-- ============================================
-- 7. VERIFY (optional)
-- ============================================
-- SELECT * FROM houses;
-- SELECT * FROM candidates;
-- SELECT * FROM bids_log;
