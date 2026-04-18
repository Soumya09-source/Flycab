-- Rides table to store ride history
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_label TEXT NOT NULL,
  end_label TEXT NOT NULL,
  start_lat DOUBLE PRECISION NOT NULL,
  start_lng DOUBLE PRECISION NOT NULL,
  end_lat DOUBLE PRECISION NOT NULL,
  end_lng DOUBLE PRECISION NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('economy','standard','premium')),
  price NUMERIC(10,2) NOT NULL,
  eta_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own rides"
  ON public.rides FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own rides"
  ON public.rides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own rides"
  ON public.rides FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_rides_user_created ON public.rides(user_id, created_at DESC);