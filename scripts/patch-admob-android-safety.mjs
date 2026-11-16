import { readFileSync, writeFileSync } from 'node:fs';
const base='node_modules/@capacitor-community/admob/android/src/main/java/com/getcapacitor/community/admob';
export function patchAndroidPlugin(source) {
  if(source.includes('MRB_ANDROID_SAFETY'))return source;
  const anchor='    @PluginMethod\n    public void showInterstitial(final PluginCall call) {';
  if(!source.includes(anchor))throw new Error('Android AdMob show anchor missing');
  return source.replace(anchor,`    // MRB_ANDROID_SAFETY
    @PluginMethod
    public void discardWordPuzzleInterstitial(final PluginCall call) {
        getActivity().runOnUiThread(() -> { adInterstitialExecutor.discard(); call.resolve(); });
    }
    @PluginMethod
    public void getWordPuzzleInterstitialState(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject result = new JSObject();
            result.put("showing", adInterstitialExecutor.isShowing());
            call.resolve(result);
        });
    }
${anchor}`);
}
export function patchAndroidExecutor(source) {
  if(source.includes('MRB_ANDROID_SAFETY'))return source;
  source=source.replace('    public static String lastPreparedAdId;',`    public static String lastPreparedAdId;
    // MRB_ANDROID_SAFETY: main-thread inventory ownership and presentation deadline.
    public static long inventoryGeneration = 0;
    private boolean showing = false;
    public boolean isShowing() { return showing; }
    public void discard() {
        inventoryGeneration++;
        preparedAds.clear();
        lastPreparedAdId = null;
    }`);
  source=source.replace('                final AdRequest adRequest', '                final long generation = ++inventoryGeneration;\n                preparedAds.clear();\n                lastPreparedAdId = null;\n                final AdRequest adRequest');
  source=source.replace('getInterstitialAdLoadCallback(call, notifyListenersFunction)', 'getInterstitialAdLoadCallback(call, notifyListenersFunction, generation)');
  const start=source.indexOf('    public void showInterstitial(');
  if(start<0 || !source.includes('final long generation'))throw new Error('Android executor anchors missing');
  return source.slice(0,start)+`    public void showInterstitial(final PluginCall call, BiConsumer<String, JSObject> notifyListenersFunction) {
        final long generation = inventoryGeneration;
        final Double deadline = call.getDouble("deadline");
        try {
            activitySupplier.get().runOnUiThread(() -> {
                if (deadline == null || System.currentTimeMillis() >= deadline || generation != inventoryGeneration || showing) {
                    call.reject("Interstitial presentation expired or busy"); return;
                }
                final Activity activity = activitySupplier.get();
                final String requested = call.getString("adId");
                final String id = requested != null ? requested : lastPreparedAdId;
                final InterstitialAd ad = id != null ? preparedAds.remove(id) : null;
                lastPreparedAdId = null;
                if (activity == null || activity.isFinishing() || activity.isDestroyed() || ad == null) {
                    call.reject("No ready interstitial or active activity"); return;
                }
                showing = true;
                ad.setFullScreenContentCallback(new com.google.android.gms.ads.FullScreenContentCallback() {
                    @Override public void onAdShowedFullScreenContent() {
                        notifyListenersFunction.accept(InterstitialAdPluginPluginEvent.Showed, new JSObject());
                    }
                    @Override public void onAdDismissedFullScreenContent() {
                        showing = false;
                        notifyListenersFunction.accept(InterstitialAdPluginPluginEvent.Dismissed, new JSObject());
                    }
                    @Override public void onAdFailedToShowFullScreenContent(com.google.android.gms.ads.AdError error) {
                        showing = false;
                        notifyListenersFunction.accept(InterstitialAdPluginPluginEvent.FailedToShow, new JSObject());
                    }
                });
                try { ad.show(activity); call.resolve(); }
                catch (Exception error) { showing = false; call.reject("Interstitial failed to present", error); }
            });
        } catch (Exception error) { call.reject("No active activity", error); }
    }
}
`;
}
export function patchAndroidCallback(source) {
  if(source.includes('MRB_ANDROID_SAFETY'))return source;
  const anchor='notifyListenersFunction: BiConsumer<String, JSObject>,';
  if(!source.includes(anchor) || !source.includes('override fun onAdLoaded(ad: InterstitialAd) {'))throw new Error('Android callback anchors missing');
  return source.replace(anchor,anchor+'\n                                      generation: Long,')
    .replace('override fun onAdLoaded(ad: InterstitialAd) {',`override fun onAdLoaded(ad: InterstitialAd) {
                // MRB_ANDROID_SAFETY: never revive discarded or cross-round inventory.
                if (generation != AdInterstitialExecutor.inventoryGeneration) {
                    call.reject("Discarded interstitial load")
                    return
                }`);
}
export function applyAndroidSafety() {
  for(const [file,patch] of [['AdMob.java',patchAndroidPlugin],['interstitial/AdInterstitialExecutor.java',patchAndroidExecutor],['interstitial/InterstitialAdCallbackAndListeners.kt',patchAndroidCallback]]) {
    const path=`${base}/${file}`; writeFileSync(path,patch(readFileSync(path,'utf8')));
  }
}