import { Capacitor } from '@capacitor/core';
import { rankingIdentity } from './identity';
import { countryFromLocale } from './country';
import { wordScore } from '../ord/handicap';
import { roundKey, type Save } from '../ord/engine';
import { cacheMonthlyBoard, restoreMonthlyCache } from './monthly-cache';

export const MONTHLY_MINIMUM = 30;
export interface MonthlyEntry { name:string;played:number;average:number;place:number|null;self?:boolean }
export interface MonthlyBoard { month:string;country:string;joined:boolean;name:string;leaders:MonthlyEntry[];self:MonthlyEntry|null }
export function previousMonth(month:string) { const date=new Date(`${month}-01T12:00:00Z`);date.setUTCMonth(date.getUTCMonth()-1);return date.toISOString().slice(0,7); }
export function currentMonth(day:string) { return day.slice(0,7); }
export function monthlyRounds(save:Save,day:string) {
  const earliest=previousMonth(day.slice(0,7));
  return Object.entries(save.rounds).flatMap(([key,round])=>{
    const slot=round.slot??0;const score=wordScore(round);
    return score===null||slot<0||slot>2||key!==roundKey(round.date,slot)||round.date>day||round.date.slice(0,7)<earliest?[]:[{day:round.date,slot,score}];
  });
}
export async function monthlyBoard(month:string,save:Save,day:string,action:'list'|'sync'|'join'|'leave'='sync',name=''):Promise<MonthlyBoard> {
  await restoreMonthlyCache(month);
  let country:string|null=null;
  if(Capacitor.isNativePlatform()) {const {Device}=await import('@capacitor/device');country=countryFromLocale((await Device.getLanguageTag()).value);}
  if(!country) for(const tag of navigator.languages??[navigator.language]) {country=countryFromLocale(tag);if(country)break;}
  if(!country) country='ZZ';
  const identity=await rankingIdentity();const {supabase}=await import('@/integrations/supabase/client');
  const {data,error}=await supabase.rpc('global_monthly_board',{p_device:identity.id,p_token:identity.token,p_month:month,p_country:country,p_action:action,p_name:name,p_platform:Capacitor.getPlatform(),p_rounds:monthlyRounds(save,day)});
  if(error)throw error;
  const board=data as unknown as MonthlyBoard;
  if(!board||!Array.isArray(board.leaders)||board.month!==month)throw new Error('Invalid board');
  await cacheMonthlyBoard(board);
  return board;
}