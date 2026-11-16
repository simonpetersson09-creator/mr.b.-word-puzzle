CREATE OR REPLACE FUNCTION public.new_friend_code() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$ DECLARE c text; BEGIN PERFORM pg_advisory_xact_lock(76452912); LOOP c:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)); EXIT WHEN NOT EXISTS(SELECT 1 FROM public.friend_devices WHERE short_code=c); END LOOP; RETURN c; END $$;
ALTER TABLE public.friend_devices ADD COLUMN short_code text;
CREATE UNIQUE INDEX friend_short_code_unique ON public.friend_devices(short_code);
ALTER TABLE public.friend_devices ALTER COLUMN short_code SET DEFAULT public.new_friend_code();
UPDATE public.friend_devices SET short_code=public.new_friend_code() WHERE short_code IS NULL;
REVOKE ALL ON FUNCTION public.new_friend_code() FROM PUBLIC;
CREATE OR REPLACE FUNCTION public.friends_action(p_device uuid,p_token text,p_action text,p_name text DEFAULT '',p_code text DEFAULT '',p_target uuid DEFAULT NULL,p_hcp numeric DEFAULT NULL,p_day text DEFAULT NULL,p_completed integer DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public,pg_catalog AS $$
DECLARE me public.friend_devices%ROWTYPE; target uuid; hash bytea; output jsonb;
BEGIN
IF p_device IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'invalid credential' USING ERRCODE='42501'; END IF;
hash := sha256(convert_to(p_token,'UTF8'));
INSERT INTO public.friend_devices(id,token_hash) VALUES(p_device,hash) ON CONFLICT(id) DO NOTHING;
SELECT * INTO me FROM public.friend_devices WHERE id=p_device FOR UPDATE;
IF me.token_hash<>hash THEN RAISE EXCEPTION 'invalid credential' USING ERRCODE='42501'; END IF;
IF p_action='sync' THEN
 IF p_hcp IS NOT NULL AND (p_hcp < -3 OR p_hcp > 3) OR p_completed IS NULL OR p_completed<0 OR p_completed>3 OR p_day IS NULL OR p_day !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'invalid result'; END IF;
 UPDATE public.friend_devices SET hcp=p_hcp,day=p_day,completed=p_completed,updated_at=now() WHERE id=p_device;
ELSIF p_action='name' THEN
 IF length(btrim(p_name))<1 OR length(btrim(p_name))>24 OR p_name ~ '[[:cntrl:]]' THEN RAISE EXCEPTION 'invalid name'; END IF;
 UPDATE public.friend_devices SET name=btrim(p_name) WHERE id=p_device;
ELSIF p_action='invite' THEN
 IF me.name='' THEN RAISE EXCEPTION 'name required'; END IF;
 IF me.request_at IS NOT NULL AND me.request_at>now()-interval '5 seconds' THEN RAISE EXCEPTION 'please wait'; END IF;
 IF (SELECT count(*) FROM public.friend_links WHERE sender=p_device OR recipient=p_device)>=100 THEN RAISE EXCEPTION 'friend limit'; END IF;
 UPDATE public.friend_devices SET request_at=now() WHERE id=p_device;
 SELECT id INTO target FROM public.friend_devices WHERE (short_code=upper(replace(p_code,' ','')) OR code=upper(replace(p_code,' ',''))) AND id<>p_device;
 IF target IS NULL THEN RAISE EXCEPTION 'invalid code'; END IF;
 IF EXISTS(SELECT 1 FROM public.friend_links WHERE ((sender=p_device AND recipient=target) OR (sender=target AND recipient=p_device))) THEN RAISE EXCEPTION 'unavailable'; END IF;
 INSERT INTO public.friend_links(sender,recipient) VALUES(p_device,target);
ELSIF p_action='accept' THEN
 UPDATE public.friend_links SET status='accepted' WHERE sender=p_target AND recipient=p_device AND status='pending';
ELSIF p_action='remove' THEN
 DELETE FROM public.friend_links WHERE status<>'blocked' AND ((sender=p_device AND recipient=p_target) OR (sender=p_target AND recipient=p_device));
ELSIF p_action='block' THEN
 IF NOT EXISTS(SELECT 1 FROM public.friend_links WHERE ((sender=p_device AND recipient=p_target) OR (sender=p_target AND recipient=p_device))) THEN RAISE EXCEPTION 'unavailable'; END IF;
 DELETE FROM public.friend_links WHERE ((sender=p_device AND recipient=p_target) OR (sender=p_target AND recipient=p_device)) AND status<>'blocked';
 INSERT INTO public.friend_links(sender,recipient,status) VALUES(p_device,p_target,'blocked') ON CONFLICT(sender,recipient) DO UPDATE SET status='blocked';
ELSIF p_action='unblock' THEN
 DELETE FROM public.friend_links WHERE sender=p_device AND recipient=p_target AND status='blocked';
ELSIF p_action<>'list' THEN RAISE EXCEPTION 'invalid action'; END IF;
SELECT jsonb_build_object('name',name,'code',short_code,'people',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',d.id,'name',d.name,'status',l.status,'incoming',l.recipient=p_device,'hcp',CASE WHEN l.status='accepted' THEN d.hcp END,'day',CASE WHEN l.status='accepted' THEN d.day END,'completed',CASE WHEN l.status='accepted' THEN d.completed END)) FROM public.friend_links l JOIN public.friend_devices d ON d.id=CASE WHEN l.sender=p_device THEN l.recipient ELSE l.sender END WHERE (l.sender=p_device OR l.recipient=p_device) AND (l.status<>'blocked' OR l.sender=p_device)), '[]'::jsonb)) INTO output FROM public.friend_devices WHERE id=p_device;
RETURN output;
END $$;
