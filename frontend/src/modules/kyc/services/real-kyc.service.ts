import { IKycService } from './kyc-service.interface';
import { KYCStepResult } from '../types/kyc.types';
import { apiClient } from '@/shared/lib/api-client';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — Real KYC Service (Production)
 * ═══════════════════════════════════════════════════════════════
 *
 * Routes all requests through Next.js proxy/handlers to the 
 * FastAPI backend.
 */
export class RealKycService implements IKycService {
  async verifyId(idType: string, idNumber: string): Promise<KYCStepResult> {
    return apiClient.post<KYCStepResult>('/kyc/verify-id', { idType, idNumber });
  }

  async ocrDocument(image: File, docType: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('doc_type', docType);
    return apiClient.postFormData<any>('/kyc/ocr', formData);
  }

  async verifyLiveness(frames: File[]): Promise<KYCStepResult> {
    const formData = new FormData();
    // Assuming the backend expects frames
    frames.forEach((f, i) => formData.append(`frame_${i}`, f));
    return apiClient.postFormData<KYCStepResult>('/kyc/liveness', formData);
  }

  async matchFace(selfie: File, documentId: string): Promise<KYCStepResult> {
    const formData = new FormData();
    formData.append('selfie', selfie);
    formData.append('document_id', documentId);
    return apiClient.postFormData<KYCStepResult>('/kyc/match', formData);
  }

  async computeRisk(payload: { occupation: string; kyc_risk_tier: string }): Promise<{ risk_score: number }> {
    return apiClient.post<{ risk_score: number }>('/kyc/compute-risk', payload);
  }

  async finalizeKYC(payload: any): Promise<KYCStepResult> {
    return apiClient.post<KYCStepResult>('/kyc/finalize', payload);
  }
}
