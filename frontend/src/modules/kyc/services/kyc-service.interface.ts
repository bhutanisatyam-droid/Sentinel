import { KYCStatus, KYCStepResult } from '../types/kyc.types';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — KYC Domain Service Interface
 * ═══════════════════════════════════════════════════════════════
 */
export interface IKycService {
  /**
   * Validate a document ID (e.g. check PAN syntax, query Govt API).
   */
  verifyId(idType: string, idNumber: string): Promise<KYCStepResult>;

  /**
   * OCR extraction and format validation.
   */
  ocrDocument(image: File, docType: string): Promise<any>;

  /**
   * Perform advanced MediaPipe / Liveness injection detection.
   */
  verifyLiveness(frames: File[]): Promise<KYCStepResult>;

  /**
   * Face match the verified live face against the OCR document.
   */
  matchFace(selfie: File, documentId: string): Promise<KYCStepResult>;

  /**
   * Calculate starting risk score based on demographic factors.
   */
  computeRisk(payload: { occupation: string; kyc_risk_tier: string }): Promise<{ risk_score: number }>;

  /**
   * Commit all temporary verification states to the canonical user profile.
   */
  finalizeKYC(payload: {
    old_user_id: string;
    new_user_id: string;
    lat?: number | null;
    lon?: number | null;
    face_match_score: number;
  }): Promise<KYCStepResult>;
}
