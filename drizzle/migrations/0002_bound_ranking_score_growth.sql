CREATE OR REPLACE FUNCTION public.submit_score(p_device uuid, p_country text, p_wins integer, p_played integer, p_token text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE total integer; below integer; cur public.player_scores%ROWTYPE; v_hash bytea; allowed integer; new_played integer; new_wins integer; eff_wins integer;
BEGIN
 IF p_device IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR p_country IS NULL OR p_country !~ '^[A-Z]{2}$' OR p_wins IS NULL OR p_played IS NULL OR p_wins < 0 OR p_played < p_wins OR p_played > 10950 THEN RAISE EXCEPTION 'invalid score'; END IF;
 v_hash := sha256(convert_to(p_token,'UTF8'));
 SELECT * INTO cur FROM public.player_scores WHERE device_id = p_device FOR UPDATE;
 IF NOT FOUND THEN
  -- New devices start from scratch: at most one day's rounds (3 words).
  new_played := least(p_played, 3);
  new_wins := least(p_wins, new_played);
  INSERT INTO public.player_scores(device_id,country,wins,played,updated_at,write_token_hash)
  VALUES(p_device,p_country,new_wins,new_played,now(),v_hash);
  eff_wins := new_wins;
 ELSE
  IF cur.write_token_hash IS NULL OR cur.write_token_hash <> v_hash THEN RAISE EXCEPTION 'invalid device credential' USING ERRCODE='42501'; END IF;
  -- Server-derived ceiling: at most 3 rounds per elapsed day since last accepted write; values never decrease.
  allowed := 3 * (ceil(extract(epoch FROM (now() - cur.updated_at)) / 86400.0)::integer + 1);
  new_played := greatest(cur.played, least(p_played, cur.played + allowed));
  new_wins := greatest(cur.wins, least(p_wins, cur.wins + (new_played - cur.played)));
  new_wins := least(new_wins, new_played);
  UPDATE public.player_scores SET wins=new_wins, played=new_played,
    updated_at = CASE WHEN new_played <> cur.played OR new_wins <> cur.wins THEN now() ELSE cur.updated_at END
  WHERE device_id = p_device;
  eff_wins := new_wins;
  p_country := cur.country;
 END IF;
 SELECT count(*), count(*) FILTER (WHERE wins < eff_wins) INTO total, below FROM public.player_scores WHERE country=p_country;
 RETURN json_build_object('players',total,'better_than',CASE WHEN total<=1 THEN 100 ELSE round(below*100.0/(total-1)) END);
END $$;
REVOKE ALL ON FUNCTION public.submit_score(uuid,text,integer,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_score(uuid,text,integer,integer,text) TO anon, authenticated, service_role;