ALTER TABLE public.player_scores ADD COLUMN IF NOT EXISTS write_token_hash bytea;
COMMENT ON COLUMN public.player_scores.write_token_hash IS 'SHA-256 of device-held write capability; NULL legacy rows cannot be claimed.';
CREATE OR REPLACE FUNCTION public.submit_score(p_device uuid, p_country text, p_wins integer, p_played integer) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE total integer; below integer;
BEGIN
 IF p_device IS NULL OR p_country IS NULL OR p_country !~ '^[A-Z]{2}$' OR p_wins IS NULL OR p_played IS NULL OR p_wins < 0 OR p_played < p_wins OR p_played > 10950 THEN RAISE EXCEPTION 'invalid score'; END IF;
 SELECT count(*), count(*) FILTER (WHERE wins < p_wins) INTO total, below FROM public.player_scores WHERE country = p_country;
 RETURN json_build_object('players', total, 'better_than', CASE WHEN total = 0 THEN 100 ELSE round(below * 100.0 / total) END);
END $$;
COMMENT ON FUNCTION public.submit_score(uuid,text,integer,integer) IS 'DEPRECATED read-only percentile compatibility; no score writes.';
REVOKE ALL ON FUNCTION public.submit_score(uuid,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_score(uuid,text,integer,integer) TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.submit_score(p_device uuid, p_country text, p_wins integer, p_played integer, p_token text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE total integer; below integer; changed integer;
BEGIN
 IF p_device IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR p_country IS NULL OR p_country !~ '^[A-Z]{2}$' OR p_wins IS NULL OR p_played IS NULL OR p_wins < 0 OR p_played < p_wins OR p_played > 10950 THEN RAISE EXCEPTION 'invalid score'; END IF;
 INSERT INTO public.player_scores(device_id,country,wins,played,updated_at,write_token_hash) VALUES(p_device,p_country,p_wins,p_played,now(),sha256(convert_to(p_token,'UTF8')))
 ON CONFLICT(device_id) DO UPDATE SET country=excluded.country,wins=excluded.wins,played=excluded.played,updated_at=now()
 WHERE public.player_scores.write_token_hash = excluded.write_token_hash;
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed = 0 THEN RAISE EXCEPTION 'invalid device credential' USING ERRCODE='42501'; END IF;
 SELECT count(*), count(*) FILTER (WHERE wins < p_wins) INTO total, below FROM public.player_scores WHERE country=p_country;
 RETURN json_build_object('players',total,'better_than',CASE WHEN total<=1 THEN 100 ELSE round(below*100.0/(total-1)) END);
END $$;
REVOKE ALL ON FUNCTION public.submit_score(uuid,text,integer,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_score(uuid,text,integer,integer,text) TO anon, authenticated, service_role;