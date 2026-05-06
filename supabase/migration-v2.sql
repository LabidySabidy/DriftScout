-- DriftScout V2 + V3 Schema Migration
-- Run all of this in Supabase SQL Editor

-- ============================
-- V2: COMMENTS
-- ============================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX comments_location_idx ON comments(location_id);

-- ============================
-- V2: PHOTO VOTES (best photo per spot)
-- ============================
CREATE TABLE photo_votes (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES location_photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, photo_id)
);

ALTER TABLE photo_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON photo_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON photo_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
  ON photo_votes FOR DELETE USING (auth.uid() = user_id);

-- ============================
-- V2: LOCATION STATUS (active/hot/busted)
-- ============================
ALTER TABLE locations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'hot', 'busted'));

CREATE INDEX locations_city_idx ON locations(city);
CREATE INDEX locations_state_idx ON locations(state);

-- ============================
-- V3: REPORTS (flag locations as inaccurate/unsafe/private)
-- ============================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('inaccurate', 'unsafe', 'private_property', 'spam', 'other')),
  detail TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are viewable by reporter"
  ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================
-- V3: MODERATOR ACTIONS
-- ============================
ALTER TABLE locations ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE locations ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- ============================
-- V3: USER FOLLOWS
-- ============================
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================
-- V3: NOTIFICATIONS
-- ============================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'location_status')),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================
-- V3: NOTIFICATION TRIGGER (auto-notify on like)
-- ============================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  loc_owner UUID;
BEGIN
  SELECT submitter_id INTO loc_owner FROM locations WHERE id = NEW.location_id;
  IF loc_owner IS NOT NULL AND loc_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, location_id)
    VALUES (loc_owner, 'like', NEW.user_id, NEW.location_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_added ON likes;
CREATE TRIGGER on_like_added
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ============================
-- V3: NOTIFICATION TRIGGER (auto-notify on comment)
-- ============================
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  loc_owner UUID;
BEGIN
  SELECT submitter_id INTO loc_owner FROM locations WHERE id = NEW.location_id;
  IF loc_owner IS NOT NULL AND loc_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, location_id, comment_id)
    VALUES (loc_owner, 'comment', NEW.user_id, NEW.location_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_added ON comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ============================
-- V3: NOTIFICATION TRIGGER (auto-notify on follow)
-- ============================
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_added ON follows;
CREATE TRIGGER on_follow_added
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ============================
-- UPDATE EXISTING LOCATIONS: set moderation_status = 'approved' for all existing
-- ============================
UPDATE locations SET moderation_status = 'approved' WHERE moderation_status = 'pending';

-- ============================
-- LEADERBOARD FUNCTION (if not already created)
-- ============================
CREATE OR REPLACE FUNCTION leaderboard()
RETURNS TABLE(submitter jsonb, spot_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_build_object('id', p.id, 'username', p.username, 'avatar_url', p.avatar_url) AS submitter,
    COUNT(l.id) AS spot_count
  FROM profiles p
  JOIN locations l ON l.submitter_id = p.id
  WHERE l.moderation_status = 'approved'
  GROUP BY p.id, p.username, p.avatar_url
  ORDER BY spot_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
