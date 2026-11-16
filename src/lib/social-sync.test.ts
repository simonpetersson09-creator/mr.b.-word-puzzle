import {beforeEach,describe,it,expect,vi} from 'vitest';
import {emptySave} from './ord/engine';
const mocks=vi.hoisted(()=>({cache:vi.fn(),friends:vi.fn(),monthly:vi.fn(),native:vi.fn()}));
vi.mock('./friends',()=>({cachedFriends:mocks.cache,friendsAction:mocks.friends}));
vi.mock('./ranking/monthly',()=>({monthlyBoard:mocks.monthly,currentMonth:(day:string)=>day.slice(0,7)}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:mocks.native}}));
import {syncSocialResults} from './social-sync';
describe('automatic social results',()=>{
  beforeEach(()=>{vi.resetAllMocks();mocks.cache.mockResolvedValue({code:'ABC123'});mocks.friends.mockResolvedValue({});mocks.monthly.mockResolvedValue({});mocks.native.mockReturnValue(true);});
  it('uploads completed results without opening either panel and joins the ranking under the automatic player name',async()=>{
    const save=emptySave();save.rounds['2026-11-16']={date:'2026-11-16',answer:'KANEL',guesses:['KANEL']};
    expect(await syncSocialResults(save,'2026-11-16')).toBe(true);
    expect(mocks.friends).toHaveBeenCalledWith('sync',{save,day:'2026-11-16'});
    expect(mocks.monthly).toHaveBeenCalledWith('2026-11',save,'2026-11-16','join',expect.stringMatching(/\d{4}/));
  });
  it('retains local results on failure and permits a later retry',async()=>{
    const save=emptySave();mocks.friends.mockRejectedValueOnce(new Error('offline'));
    expect(await syncSocialResults(save,'2026-11-16')).toBe(false);
    expect(await syncSocialResults(save,'2026-11-16')).toBe(true);
    expect(mocks.friends).toHaveBeenCalledTimes(2);
  });
  it('does not enroll unregistered friends or web rankings',async()=>{
    mocks.cache.mockResolvedValue(null);mocks.native.mockReturnValue(false);
    expect(await syncSocialResults(emptySave(),'2026-11-16')).toBe(true);
    expect(mocks.friends).not.toHaveBeenCalled();expect(mocks.monthly).not.toHaveBeenCalled();
  });
});