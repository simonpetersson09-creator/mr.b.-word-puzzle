CREATE OR REPLACE FUNCTION public.word_admin_daily_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH dates AS (
 SELECT (timezone('Europe/Stockholm', now())::date - n)::date AS day FROM generate_series(0,29) n
), app_rounds AS (
 SELECT r.day, r.device_id, r.score, p.platform
 FROM public.monthly_rounds r JOIN public.monthly_players p ON p.device_id=r.device_id
 WHERE p.platform IN ('ios','android') AND r.day BETWEEN timezone('Europe/Stockholm', now())::date-29 AND timezone('Europe/Stockholm', now())::date
), daily AS (
 SELECT d.day, count(DISTINCT r.device_id)::integer AS played,
 count(DISTINCT r.device_id) FILTER (WHERE r.platform='ios')::integer AS ios,
 count(DISTINCT r.device_id) FILTER (WHERE r.platform='android')::integer AS android,
 count(r.device_id)::integer AS finished,
 count(r.device_id) FILTER (WHERE r.score<3)::integer AS wins,
 round(avg(r.score),2) AS average
 FROM dates d LEFT JOIN app_rounds r ON r.day=d.day GROUP BY d.day
)
SELECT jsonb_agg(jsonb_build_object('day',day,'played',played,'ios',ios,'android',android,'finished',finished,'wins',wins,'average',average) ORDER BY day DESC) FROM daily;
$$;
REVOKE ALL ON FUNCTION public.word_admin_daily_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.word_admin_daily_stats() TO service_role;