export function patchInterstitialSafety(source) {
  if (source.includes('MRB_INTERSTITIAL_SAFETY')) return source;
  const replace = (anchor, replacement) => {
    if (!source.includes(anchor)) throw new Error(`Interstitial safety anchor missing: ${anchor}`);
    source=source.replace(anchor,replacement);
  };
  replace('    private var currentlyShowingAdId: String?', `    // MRB_INTERSTITIAL_SAFETY: invalidate queued loads, not only JS readiness.
    private var inventoryGeneration = 0
    func discardPreparedInventory() -> Bool {
        guard currentlyShowingAdId == nil else { return false }
        inventoryGeneration += 1
        preparedAds.removeAll()
        lastPreparedAdId = nil
        return true
    }
    var isShowing: Bool { currentlyShowingAdId != nil }
    private var currentlyShowingAdId: String?`);
  replace('        InterstitialAd.load(', '        let loadGeneration = inventoryGeneration\n        InterstitialAd.load(');
  replace('                if let error = error {', `                guard loadGeneration == self.inventoryGeneration else {
                    call.reject("Discarded outdated interstitial inventory")
                    return
                }
                if let error = error {`);
  replace('        guard let adId = call.getString', `        guard let deadline = call.getDouble("deadline"), Date().timeIntervalSince1970 * 1000 < deadline else {
            call.reject("Interstitial presentation deadline expired")
            return
        }
        guard let adId = call.getString`);
  replace('        if let rootViewController = plugin?.getRootVC() {', `        guard let rootViewController = plugin?.getRootVC(), rootViewController.viewIfLoaded?.window != nil else {
            call.reject("No active ViewController")
            return
        }
        do {`);
  return source;
}

export function patchPluginSafety(source) {
  if (!source.includes('@objc func discardWordPuzzleInterstitial(')) {
    const anchor='    @objc func prepareInterstitial(_ call: CAPPluginCall) {';
    if (!source.includes(anchor)) throw new Error('Interstitial plugin anchor missing');
    source=source.replace(anchor,`    @objc func discardWordPuzzleInterstitial(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if self.adInterstitialExecutor.discardPreparedInventory() { call.resolve() }
            else { call.reject("Interstitial is showing") }
        }
    }
    @objc func getWordPuzzleInterstitialState(_ call: CAPPluginCall) {
        DispatchQueue.main.async { call.resolve(["showing": self.adInterstitialExecutor.isShowing]) }
    }

${anchor}`);
    const registration='        CAPPluginMethod(name: "prepareInterstitial", returnType: CAPPluginReturnPromise),';
    source=source.replace(registration,`        CAPPluginMethod(name: "discardWordPuzzleInterstitial", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getWordPuzzleInterstitialState", returnType: CAPPluginReturnPromise),
${registration}`);
  }
  for (const action of ['prepareInterstitial','showInterstitial']) {
    const anchor=`            self.adInterstitialExecutor.${action}(`;
    if(!source.includes(`self.adInterstitialExecutor.plugin = self\n${anchor}`))source=source.replace(anchor,`            self.adInterstitialExecutor.plugin = self\n${anchor}`);
  }
  source=source.replace('call.resolve(["canRequestAds": ConsentInformation.shared.canRequestAds])',`call.resolve([
                "canRequestAds": ConsentInformation.shared.canRequestAds,
                "privacyOptionsRequirementStatus": ConsentInformation.shared.privacyOptionsRequirementStatus == .required ? "REQUIRED" : "NOT_REQUIRED"
            ])`);
  return source;
}