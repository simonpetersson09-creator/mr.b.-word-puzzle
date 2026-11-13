export function patchConsentEligibility(source) {
  return source.replace(
    'call.resolve(["canRequestAds": ConsentInformation.shared.canRequestAds])',
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