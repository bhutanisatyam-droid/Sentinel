import { IKycService } from './kyc-service.interface';
import { KYCStepResult } from '../types/kyc.types';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — Mock KYC Service (Demo Mode)
 * ═══════════════════════════════════════════════════════════════
 *
 * Guaranteed to return fast, successful responses for presentations
 * without hitting rate limits or requiring real Govt APIs.
 */
export class MockKycService implements IKycService {
  async verifyId(idType: string, idNumber: string): Promise<KYCStepResult> {
    return { success: true, data: { name: 'Demo Verified User' }, message: 'Verified locally' };
  }

  async ocrDocument(image: File, docType: string): Promise<any> {
    return { 
      success: true, 
      data: { extractedText: `Sample OCR for ${docType}`, confidence: 0.98 } 
    };
  }

  async verifyLiveness(frames: File[]): Promise<KYCStepResult> {
    return { success: true, data: { livenessScore: 0.99 }, message: 'Liveness check passed' };
  }

  async matchFace(selfie: File, documentId: string): Promise<KYCStepResult> {
    return { success: true, data: { matchScore: 0.95 }, message: 'Face matched' };
  }

  async computeRisk(payload: { occupation: string; kyc_risk_tier: string }): Promise<{ risk_score: number }> {
    return { risk_score: 12 };
  }

  async finalizeKYC(payload: any): Promise<KYCStepResult> {
    return { success: true, message: 'KYC Finalized' };
  }
}
