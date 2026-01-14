export const ComplianceConfig = {
    // Threshold for mandatory reporting (e.g., ₹50,000 for certain regions)
    REPORTING_THRESHOLD: 50000,

    // Threshold that triggers "Structuring" detection algorithms
    // Intentionally set just below the reporting threshold to catch evasion attempts
    STRUCTURING_THRESHOLD: 49999,

    // High velocity check interval (in minutes)
    VELOCITY_CHECK_WINDOW_MINUTES: 30,

    // Risk score weightings
    RISK_WEIGHTS: {
        AMOUNT: 0.4,
        VELOCITY: 0.3,
        KEYWORDS: 0.2,
        LOCATION: 0.1
    }
};
