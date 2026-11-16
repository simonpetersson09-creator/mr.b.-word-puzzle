CREATE OR REPLACE FUNCTION public.global_monthly_board(p_device uuid,p_token text,p_month text,p_country text DEFAULT 'ZZ',p_action text DEFAULT 'list',p_name text DEFAULT '',p_platform text DEFAULT 'web',p_rounds jsonb DEFAULT '[]') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_catalog AS $$
DECLARE original jsonb; output jsonb; start_day date; end_day date;
BEGIN
original:=public.monthly_board(p_device,p_token,p_month,p_country,p_action,p_name,p_platform,p_rounds);
start_day:=(p_month||'-01')::date; end_day:=(start_day+interval '1 month')::date;
WITH totals AS (SELECT p.device_id,p.name,count(*)::integer AS played,avg(r.score) AS average FROM public.monthly_players p JOIN public.monthly_rounds r ON r.device_id=p.device_id WHERE p.enabled AND p.platform IN ('ios','android') AND r.day>=start_day AND r.day<end_day GROUP BY p.device_id,p.name), ranked AS (SELECT *,rank() OVER(ORDER BY average)::integer AS place FROM totals WHERE played>=30), leaders AS (SELECT * FROM ranked ORDER BY average,name,device_id LIMIT 20)
SELECT original || jsonb_build_object('leaders',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',name,'played',played,'average',average,'place',place,'self',device_id=p_device) ORDER BY average,name,device_id) FROM leaders),'[]'::jsonb),'self',(SELECT jsonb_build_object('name',name,'played',played,'average',average,'place',(SELECT place FROM ranked WHERE device_id=p_device)) FROM totals WHERE device_id=p_device)) INTO output;
RETURN output;
END $$;
REVOKE ALL ON FUNCTION public.global_monthly_board(uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.global_monthly_board(uuid,text,text,text,text,text,text,jsonb) TO anon,authenticated;