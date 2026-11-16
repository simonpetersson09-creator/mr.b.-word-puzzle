import {beforeEach,expect,it,vi} from 'vitest';
import {emptySave} from '../ord/engine';
const mocks=vi.hoisted(()=>({locale:vi.fn(),rpc:vi.fn(),cache:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>true,getPlatform:()=> 'ios'}}));
vi.mock('@capacitor/device',()=>({Device:{getLanguageTag:mocks.locale}}));
vi.mock('./identity',()=>({rankingIdentity:async()=>({id:'test-device',token:'test-capability'})}));
vi.mock('./monthly-cache',()=>({restoreMonthlyCache:async()=>null,cacheMonthlyBoard:mocks.cache}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
import {monthlyBoard} from './monthly';
beforeEach(()=>{vi.clearAllMocks();});
it('still uploads completed results when the native language lookup fails',async()=>{
  mocks.locale.mockRejectedValue(new Error('Device unavailable'));
  const board={month:'2026-11',country:'ZZ',joined:true,name:'Player 1234',leaders:[],self:null};
  mocks.rpc.mockResolvedValue({data:board,error:null});
  const save=emptySave();save.rounds['2026-11-16']={date:'2026-11-16',answer:'KANEL',guesses:['KANEL']};
  expect(await monthlyBoard('2026-11',save,'2026-11-16','join','Player 1234')).toEqual(board);
  expect(mocks.rpc).toHaveBeenCalledWith('global_monthly_board',expect.objectContaining({p_platform:'ios',p_action:'join',p_name:'Player 1234',p_rounds:[{day:'2026-11-16',slot:0,score:-3}]}));
  expect(mocks.cache).toHaveBeenCalledWith(board);
});