CREATE TABLE public.player_scores (
  device_id uuid PRIMARY KEY,
  country text NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  played integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.player_scores TO service_role;
ALTER TABLE public.player_scores ENABLE ROW LEVEL SECURITY;
CREATE INDEX player_scores_country_wins ON public.player_scores (country, wins);

CREATE OR REPLACE FUNCTION public.submit_score(p_device uuid, p_country text, p_wins integer, p_played integer)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE total integer; below integer;
BEGIN
  IF p_country !~ '^[A-Z]{2}$' OR p_wins < 0 OR p_played < p_wins OR p_played > 3 * 3650 THEN
    RAISE EXCEPTION 'invalid score';
  END IF;
  INSERT INTO player_scores(device_id, country, wins, played, updated_at)
  VALUES (p_device, p_country, p_wins, p_played, now())
  ON CONFLICT (device_id) DO UPDATE SET country = excluded.country, wins = excluded.wins, played = excluded.played, updated_at = now();
  SELECT count(*), count(*) FILTER (WHERE wins < p_wins) INTO total, below FROM player_scores WHERE country = p_country;
  RETURN json_build_object('players', total, 'better_than', CASE WHEN total <= 1 THEN 100 ELSE round(below * 100.0 / (total - 1)) END);
END $$;
REVOKE ALL ON FUNCTION public.submit_score(uuid, text, integer, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_score(uuid, text, integer, integer) TO anon, authenticated;