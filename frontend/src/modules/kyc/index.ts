import { isDemoMode } from '@/shared/config/env';
import { IKycService } from './services/kyc-service.interface';
import { RealKycService } from './services/real-kyc.service';
import { MockKycService } from './services/mock-kyc.service';

/**
 * ═══════════════════════════════════════════════════════════════
 * SENTINEL — KYC Module Public API
 * ═══════════════════════════════════════════════════════════════
 *
 * This barrel file is the strictly enforced boundary for the KYC domain.
 * AML modules and main app pages must import dependencies exclusively from here.
 */

// Export types
export * from './types/kyc.types';

// Inject service based on environment flag
let _serviceInstance: IKycService | null = null;

export function getKycService(): IKycService {
  if (!_serviceInstance) {
    _serviceInstance = isDemoMode() ? new MockKycService() : new RealKycService();
  }
  return _serviceInstance;
}
