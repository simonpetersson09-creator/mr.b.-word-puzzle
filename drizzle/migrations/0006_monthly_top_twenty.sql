CREATE TABLE public.monthly_players(device_id uuid PRIMARY KEY REFERENCES public.friend_devices(id),name text NOT NULL,country text NOT NULL,enabled boolean NOT NULL DEFAULT false,platform text NOT NULL);
GRANT ALL ON public.monthly_players TO service_role;
ALTER TABLE public.monthly_players ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.monthly_rounds(device_id uuid NOT NULL REFERENCES public.monthly_players(device_id),day date NOT NULL,slot integer NOT NULL CHECK(slot BETWEEN 0 AND 2),score integer NOT NULL CHECK(score BETWEEN -3 AND 3),PRIMARY KEY(device_id,day,slot));
GRANT ALL ON public.monthly_rounds TO service_role;
ALTER TABLE public.monthly_rounds ENABLE ROW LEVEL SECURITY;
CREATE INDEX monthly_rounds_day ON public.monthly_rounds(day);
CREATE OR REPLACE FUNCTION public.monthly_board(p_device uuid,p_token text,p_month text,p_country text,p_action text DEFAULT 'list',p_name text DEFAULT '',p_platform text DEFAULT 'web',p_rounds jsonb DEFAULT '[]') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE start_day date; end_day date; item jsonb; played_day date; participant public.monthly_players%ROWTYPE; output jsonb;
BEGIN
PERFORM public.friends_action(p_device,p_token,'list');
IF p_month IS NULL OR p_month !~ '^\d{4}-(0[1-9]|1[0-2])$' OR p_country IS NULL OR p_country !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'invalid month or country'; END IF;
start_day:=(p_month||'-01')::date; end_day:=(start_day+interval '1 month')::date;
IF p_action='join' THEN
 IF p_platform NOT IN ('ios','android') OR length(btrim(p_name)) NOT BETWEEN 1 AND 24 OR p_name ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'invalid player'; END IF;
 INSERT INTO public.monthly_players(device_id,name,country,enabled,platform) VALUES(p_device,btrim(p_name),p_country,true,p_platform) ON CONFLICT(device_id) DO UPDATE SET name=EXCLUDED.name,enabled=true;
ELSIF p_action='leave' THEN UPDATE public.monthly_players SET enabled=false WHERE device_id=p_device;
ELSIF p_action NOT IN ('list','sync') THEN RAISE EXCEPTION 'invalid action'; END IF;
SELECT * INTO participant FROM public.monthly_players WHERE device_id=p_device;
IF p_action IN ('sync','join') AND participant.enabled AND participant.platform IN ('ios','android') THEN
 IF jsonb_typeof(p_rounds)<>'array' OR jsonb_array_length(p_rounds)>186 THEN RAISE EXCEPTION 'invalid rounds'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rounds) LOOP
  IF jsonb_typeof(item)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(item))<>3 OR item->>'day' IS NULL OR item->>'day' !~ '^\d{4}-\d{2}-\d{2}$' OR item->>'slot' IS NULL OR item->>'slot' !~ '^[0-2]$' OR item->>'score' IS NULL OR item->>'score' !~ '^(-[1-3]|[0-3])$' THEN RAISE EXCEPTION 'invalid round'; END IF;
  played_day:=(item->>'day')::date;
  IF played_day < (date_trunc('month',now())-interval '1 month')::date OR played_day > (now() AT TIME ZONE 'Pacific/Kiritimati')::date THEN RAISE EXCEPTION 'invalid game day'; END IF;
  INSERT INTO public.monthly_rounds(device_id,day,slot,score) VALUES(p_device,played_day,(item->>'slot')::integer,(item->>'score')::integer) ON CONFLICT(device_id,day,slot) DO NOTHING;
 END LOOP;
END IF;
WITH totals AS (SELECT p.device_id,p.name,count(*)::integer AS played,sum(r.score)::integer AS total,avg(r.score) AS average FROM public.monthly_players p JOIN public.monthly_rounds r ON r.device_id=p.device_id WHERE p.enabled AND p.platform IN ('ios','android') AND p.country=COALESCE(participant.country,p_country) AND r.day>=start_day AND r.day<end_day GROUP BY p.device_id,p.name), ranked AS (SELECT *,rank() OVER(ORDER BY average)::integer AS place FROM totals WHERE played>=30), leaders AS (SELECT * FROM ranked ORDER BY average,name,device_id LIMIT 20)
SELECT jsonb_build_object('month',p_month,'country',COALESCE(participant.country,p_country),'joined',COALESCE(participant.enabled,false),'name',COALESCE(participant.name,''),'leaders',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',name,'played',played,'average',average,'place',place,'self',device_id=p_device) ORDER BY average,name,device_id) FROM leaders),'[]'::jsonb),'self',(SELECT jsonb_build_object('name',name,'played',played,'average',average,'place',(SELECT place FROM ranked WHERE device_id=p_device)) FROM totals WHERE device_id=p_device)) INTO output;
RETURN output;
END $$;
REVOKE ALL ON FUNCTION public.monthly_board(uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.monthly_board(uuid,text,text,text,text,text,text,jsonb) TO anon,authenticated;