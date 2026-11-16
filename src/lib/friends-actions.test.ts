import {beforeEach,expect,it,vi} from 'vitest';
import {emptySave} from './ord/engine';
const mocks=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('./ranking/identity',()=>({rankingIdentity:async()=>({id:'device',token:'private-test-capability'})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>false}}));
import {friendsAction} from './friends';
beforeEach(()=>{mocks.rpc.mockReset();mocks.rpc.mockResolvedValue({data:{name:'Simon',code:'ABC123',people:[]},error:null});});
it('saves the settings player name before sending a friend invitation',async()=>{
  const save=emptySave();save.settings.playerName='Simon';
  await friendsAction('invite',{save,day:'2026-11-16',code:'DEF 456'});
  expect(mocks.rpc.mock.calls[0]?.[1]).toMatchObject({p_action:'name',p_name:'Simon'});
  expect(mocks.rpc.mock.calls[1]?.[1]).toMatchObject({p_action:'invite',p_code:'DEF456'});
});
it('registers the numbered default name without requiring manual name entry',async()=>{
  const save=emptySave();save.settings.playerNumber=4628;
  await friendsAction('sync',{save,day:'2026-11-16'});
  expect(mocks.rpc.mock.calls[0]?.[1].p_name).toMatch(/4628$/);
  expect(mocks.rpc.mock.calls[1]?.[1]).toMatchObject({p_action:'sync',p_completed:0,p_results:[null,null,null]});
});