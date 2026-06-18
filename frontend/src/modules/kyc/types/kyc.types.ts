export interface KYCDocument {
  id: string;
  userId: string;
  docType: 'PAN' | 'AADHAAR' | 'PASSPORT' | 'DL';
  rawImageId: string;
  extractionResult?: any;
  /** Masked number: for PAN/DL only. Aadhaar uses vault token instead. */
  maskedNumber: string;
  /** 
   * Whether Aadhaar has been verified (without storing the number).
   * Check aadhaar_verifications table for vault_token.
   */
  aadhaarVerified: boolean;
  verifiedAt?: string;
}

export interface KYCStatus {
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REQUIRES_MANUAL_REVIEW';
  riskScore: number;
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLACKLIST';
  documents: KYCDocument[];
}

export interface KYCStepResult {
  success: boolean;
  message?: string;
  data?: any;
}
