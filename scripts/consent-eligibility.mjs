export function patchConsentEligibility(source) {
  return source.replace(
    /call\.resolve\(\["canRequestAds": ConsentInformation\.shared\.canRequestAds\]\)|call\.resolve\(\[\s*"canRequestAds": ConsentInformation\.shared\.canRequestAds,\s*"privacyOptionsRequirementStatus": ConsentInformation\.shared\.privacyOptionsRequirementStatus == \.required \? "REQUIRED" : "NOT_REQUIRED"\s*\]\)/,
    `let information = ConsentInformation.shared
            let privacyStatus: String
            switch information.privacyOptionsRequirementStatus {
            case .required: privacyStatus = "REQUIRED"
            case .notRequired: privacyStatus = "NOT_REQUIRED"
            default: privacyStatus = "UNKNOWN"
            }
            call.resolve(["canRequestAds": information.canRequestAds,
                          "privacyOptionsRequirementStatus": privacyStatus])`,
  );
}