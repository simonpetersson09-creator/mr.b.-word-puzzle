ALTER TABLE public.friend_devices ADD COLUMN daily_results jsonb;
CREATE OR REPLACE FUNCTION public.friends_daily_action(p_device uuid,p_token text,p_action text,p_name text DEFAULT '',p_code text DEFAULT '',p_target uuid DEFAULT NULL,p_hcp numeric DEFAULT NULL,p_day text DEFAULT NULL,p_completed integer DEFAULT 0,p_results jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE output jsonb; item jsonb; finished integer:=0; attempts integer; score integer; people jsonb;
BEGIN
IF p_action='sync' AND p_results IS NOT NULL THEN
 IF jsonb_typeof(p_results)<>'array' OR jsonb_array_length(p_results)<>3 THEN RAISE EXCEPTION 'invalid daily results'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_results) LOOP
  IF item='null'::jsonb THEN CONTINUE; END IF;
  IF jsonb_typeof(item)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(item))<>3 OR jsonb_typeof(item->'won') IS DISTINCT FROM 'boolean' OR jsonb_typeof(item->'attempts') IS DISTINCT FROM 'number' OR jsonb_typeof(item->'score') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'invalid daily result'; END IF;
  IF (item->>'attempts') !~ '^[1-6]$' OR (item->>'score') !~ '^(-[1-3]|[0-3])$' THEN RAISE EXCEPTION 'invalid daily score'; END IF;
  attempts:=(item->>'attempts')::integer; score:=(item->>'score')::integer;
  IF ((item->>'won')::boolean AND score<>attempts-4) OR (NOT (item->>'won')::boolean AND (attempts<>6 OR score<>3)) THEN RAISE EXCEPTION 'invalid daily score'; END IF;
  finished:=finished+1;
 END LOOP;
 IF finished<>p_completed THEN RAISE EXCEPTION 'invalid completed count'; END IF;
END IF;
output:=public.friends_action(p_device,p_token,p_action,p_name,p_code,p_target,p_hcp,p_day,p_completed);
IF p_action='sync' THEN UPDATE public.friend_devices SET daily_results=p_results WHERE id=p_device; END IF;
SELECT COALESCE(jsonb_agg(person || jsonb_build_object('results',CASE WHEN person->>'status'='accepted' THEN d.daily_results ELSE NULL END)), '[]'::jsonb) INTO people FROM jsonb_array_elements(output->'people') person JOIN public.friend_devices d ON d.id=(person->>'id')::uuid;
RETURN jsonb_set(output,'{people}',people);
END $$;
REVOKE ALL ON FUNCTION public.friends_daily_action(uuid,text,text,text,text,uuid,numeric,text,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.friends_daily_action(uuid,text,text,text,text,uuid,numeric,text,integer,jsonb) TO anon,authenticated;