-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enums as check constraints via text fields for flexibility

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'business_venue', 'business_organizer', 'admin')),
  display_name TEXT,
  avatar_url TEXT,
  preferred_locale TEXT NOT NULL DEFAULT 'en' CHECK (preferred_locale IN ('en', 'ro')),
  newsletter_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business accounts
CREATE TABLE business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('venue', 'organizer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  name TEXT NOT NULL,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venues (fixed location for venue-type businesses)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL UNIQUE REFERENCES business_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published', 'archived')),
  source TEXT NOT NULL DEFAULT 'business' CHECK (source IN ('business', 'admin')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  genre TEXT NOT NULL CHECK (genre IN (
    'techno', 'house', 'afro_house', 'minimal', 'hip_hop_rnb', 'commercial',
    'latin', 'pop', 'edm', 'live_music', 'jazz', 'open_format'
  )),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'party', 'concert', 'festival', 'rooftop', 'brunch_day_party',
    'social_gathering', 'club_night', 'live_performance', 'private_event'
  )),
  price NUMERIC(10, 2),
  ticket_url TEXT,
  cover_image_url TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  translations JSONB NOT NULL DEFAULT '{}',
  is_promoted BOOLEAN NOT NULL DEFAULT false,
  promotion_intensity INTEGER NOT NULL DEFAULT 1 CHECK (promotion_intensity BETWEEN 1 AND 3),
  rejection_reason TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  address TEXT,
  venue_name TEXT,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(translations->'en'->>'title', '') || ' ' ||
      coalesce(translations->'ro'->>'title', '') || ' ' ||
      coalesce(venue_name, '') || ' ' ||
      coalesce(address, '')
    )
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX events_status_starts_at_idx ON events (status, starts_at);
CREATE INDEX events_location_idx ON events USING GIST (location);
CREATE INDEX events_promoted_starts_at_idx ON events (is_promoted, starts_at DESC);
CREATE INDEX events_search_vector_idx ON events USING GIN (search_vector);

-- Event saves
CREATE TABLE event_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

-- Event reminders
CREATE TABLE event_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  remind_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX event_reminders_pending_idx ON event_reminders (remind_at) WHERE sent_at IS NULL;

-- Feed posts ("What did you miss?")
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID REFERENCES business_accounts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'party_updates', 'nightlife_news', 'nightlife_chaos', 'club_moments'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'approved', 'published', 'rejected'
  )),
  translations JSONB NOT NULL DEFAULT '{}',
  media_url TEXT,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feed_posts_status_published_idx ON feed_posts (status, published_at DESC);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event_boost', 'feed_post', 'newsletter', 'social_media')),
  target_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  stripe_payment_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX promotions_active_idx ON promotions (business_account_id, is_active, expires_at);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id UUID NOT NULL UNIQUE REFERENCES business_accounts(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  quota_promoted_events INTEGER NOT NULL DEFAULT 4,
  quota_feed_posts INTEGER NOT NULL DEFAULT 4,
  quota_newsletters INTEGER NOT NULL DEFAULT 2,
  quota_social_posts INTEGER NOT NULL DEFAULT 2,
  used_promoted_events INTEGER NOT NULL DEFAULT 0,
  used_feed_posts INTEGER NOT NULL DEFAULT 0,
  used_newsletters INTEGER NOT NULL DEFAULT 0,
  used_social_posts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('view', 'save', 'click', 'ticket_click', 'share')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'feed_post')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_entity_idx ON analytics_events (entity_type, entity_id, created_at);
CREATE INDEX analytics_type_idx ON analytics_events (type, created_at);

-- Stripe webhook idempotency
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER business_accounts_updated_at BEFORE UPDATE ON business_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER feed_posts_updated_at BEFORE UPDATE ON feed_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Distance query function
CREATE OR REPLACE FUNCTION events_within_distance(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_distance_km DOUBLE PRECISION
)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM events e
  WHERE e.status = 'published'
    AND ST_DWithin(
      e.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_distance_km * 1000
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if user is business
CREATE OR REPLACE FUNCTION is_business()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('business_venue', 'business_organizer')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get business account id for current user
CREATE OR REPLACE FUNCTION current_business_account_id()
RETURNS UUID AS $$
  SELECT id FROM business_accounts WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Public profiles readable by owner"
  ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin update any profile"
  ON profiles FOR UPDATE USING (is_admin());

-- Business accounts policies
CREATE POLICY "Business accounts readable by owner or admin"
  ON business_accounts FOR SELECT
  USING (profile_id = auth.uid() OR is_admin());
CREATE POLICY "Users create own business account"
  ON business_accounts FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owner updates own business account"
  ON business_accounts FOR UPDATE
  USING (profile_id = auth.uid());
CREATE POLICY "Admin manages business accounts"
  ON business_accounts FOR ALL USING (is_admin());

-- Venues policies
CREATE POLICY "Venues readable by owner or admin"
  ON venues FOR SELECT
  USING (business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Business creates own venue"
  ON venues FOR INSERT
  WITH CHECK (business_account_id = current_business_account_id());
CREATE POLICY "Business updates own venue"
  ON venues FOR UPDATE
  USING (business_account_id = current_business_account_id());

-- Events policies
CREATE POLICY "Published events readable by all"
  ON events FOR SELECT
  USING (status = 'published' OR business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Business creates events"
  ON events FOR INSERT
  WITH CHECK (business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Business updates own events"
  ON events FOR UPDATE
  USING (business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Admin deletes events"
  ON events FOR DELETE USING (is_admin());

-- Event saves policies
CREATE POLICY "Users manage own saves"
  ON event_saves FOR ALL USING (auth.uid() = user_id);

-- Event reminders policies
CREATE POLICY "Users manage own reminders"
  ON event_reminders FOR ALL USING (auth.uid() = user_id);

-- Feed posts policies
CREATE POLICY "Published feed posts readable by all"
  ON feed_posts FOR SELECT
  USING (status = 'published' OR business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Business submits feed posts"
  ON feed_posts FOR INSERT
  WITH CHECK (business_account_id = current_business_account_id() OR is_admin());
CREATE POLICY "Business updates own feed posts"
  ON feed_posts FOR UPDATE
  USING (business_account_id = current_business_account_id() OR is_admin());

-- Promotions policies
CREATE POLICY "Business reads own promotions"
  ON promotions FOR SELECT
  USING (business_account_id = current_business_account_id() OR is_admin());

-- Subscriptions policies
CREATE POLICY "Business reads own subscription"
  ON subscriptions FOR SELECT
  USING (business_account_id = current_business_account_id() OR is_admin());

-- Analytics: no public read; inserts via service role
CREATE POLICY "No public analytics read"
  ON analytics_events FOR SELECT USING (is_admin() OR is_business());

-- Stripe webhooks: service role only (no policies = deny all for anon/authenticated)

-- Storage buckets (run via Supabase dashboard or seed)
-- event-images: public read, business write
-- feed-media: public read, business write
