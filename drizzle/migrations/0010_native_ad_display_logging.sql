CREATE TABLE public.word_ad_devices (device_id uuid PRIMARY KEY, token_hash bytea NOT NULL);
GRANT ALL ON public.word_ad_devices TO service_role;
ALTER TABLE public.word_ad_devices ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.word_ad_displays (device_id uuid NOT NULL REFERENCES public.word_ad_devices(device_id), round_id text NOT NULL CHECK (round_id ~ '^\d{4}-\d{2}-\d{2}(:[23])?$'), platform text NOT NULL CHECK (platform IN ('ios','android')), is_test boolean NOT NULL, displayed_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(device_id,round_id));
GRANT ALL ON public.word_ad_displays TO service_role;
ALTER TABLE public.word_ad_displays ENABLE ROW LEVEL SECURITY;
CREATE INDEX word_ad_displays_date ON public.word_ad_displays(displayed_at);
CREATE OR REPLACE FUNCTION public.word_record_ad_display(p_device uuid,p_token text,p_round text,p_platform text,p_test boolean,p_displayed_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE h bytea; stored bytea;
BEGIN
 IF p_device IS NULL OR p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR p_round IS NULL OR p_round !~ '^\d{4}-\d{2}-\d{2}(:[23])?$' OR p_platform IS NULL OR p_platform NOT IN ('ios','android') OR p_test IS NULL OR p_displayed_at IS NULL THEN RAISE EXCEPTION 'invalid display'; END IF;
 IF p_displayed_at > now()+interval '5 minutes' OR p_displayed_at < now()-interval '30 days' OR left(p_round,10)::date > (p_displayed_at AT TIME ZONE 'UTC')::date+1 OR left(p_round,10)::date < (p_displayed_at AT TIME ZONE 'UTC')::date-2 THEN RAISE EXCEPTION 'invalid display date'; END IF;
 h=sha256(convert_to(p_token,'UTF8'));
 INSERT INTO public.word_ad_devices(device_id,token_hash) VALUES(p_device,h) ON CONFLICT DO NOTHING;
 SELECT token_hash INTO stored FROM public.word_ad_devices WHERE device_id=p_device FOR UPDATE;
 IF stored<>h THEN RAISE EXCEPTION 'invalid credential' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.word_ad_displays WHERE device_id=p_device AND round_id=p_round) THEN RETURN true; END IF;
 IF (SELECT count(*) FROM public.word_ad_displays WHERE device_id=p_device AND received_at>=date_trunc('day',now()))>=90 THEN RAISE EXCEPTION 'display limit'; END IF;
 INSERT INTO public.word_ad_displays(device_id,round_id,platform,is_test,displayed_at) VALUES(p_device,p_round,p_platform,p_test,p_displayed_at);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.word_record_ad_display(uuid,text,text,text,boolean,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.word_record_ad_display(uuid,text,text,text,boolean,timestamptz) TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.word_admin_daily_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
WITH dates AS (
 SELECT d::date AS day FROM generate_series(date '2026-11-19', timezone('Europe/Stockholm', now())::date, interval '1 day') d
), app_rounds AS (
 SELECT r.day, r.device_id, r.score, p.platform FROM public.monthly_rounds r JOIN public.monthly_players p ON p.device_id=r.device_id
 WHERE p.platform IN ('ios','android') AND r.day BETWEEN date '2026-11-19' AND timezone('Europe/Stockholm', now())::date
), ads AS (
 SELECT timezone('Europe/Stockholm',displayed_at)::date AS day,
 count(*) FILTER (WHERE NOT is_test)::integer AS ad_shown,
 count(*) FILTER (WHERE NOT is_test AND platform='ios')::integer AS ad_ios,
 count(*) FILTER (WHERE NOT is_test AND platform='android')::integer AS ad_android,
 count(*) FILTER (WHERE is_test)::integer AS ad_test
 FROM public.word_ad_displays GROUP BY 1
), daily AS (
 SELECT d.day, count(DISTINCT r.device_id)::integer AS played,
 count(DISTINCT r.device_id) FILTER (WHERE r.platform='ios')::integer AS ios,
 count(DISTINCT r.device_id) FILTER (WHERE r.platform='android')::integer AS android,
 count(r.device_id)::integer AS finished, count(r.device_id) FILTER (WHERE r.score<3)::integer AS wins, round(avg(r.score),2) AS average
 FROM dates d LEFT JOIN app_rounds r ON r.day=d.day GROUP BY d.day
)
SELECT coalesce(jsonb_agg(jsonb_build_object('day',d.day,'played',played,'ios',ios,'android',android,'finished',finished,'wins',wins,'average',average,'adShown',coalesce(a.ad_shown,0),'adIos',coalesce(a.ad_ios,0),'adAndroid',coalesce(a.ad_android,0),'adTest',coalesce(a.ad_test,0)) ORDER BY d.day DESC),'[]'::jsonb) FROM daily d LEFT JOIN ads a ON a.day=d.day;
$$;
REVOKE ALL ON FUNCTION public.word_admin_daily_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.word_admin_daily_stats() TO service_role;