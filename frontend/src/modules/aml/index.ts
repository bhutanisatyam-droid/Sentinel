import { isDemoMode } from '@/shared/config/env';
import { IAmlService } from './services/aml-service.interface';
import { RealAmlService } from './services/real-aml.service';
import { MockAmlService } from './services/mock-aml.service';

// Export types
export * from './types/aml.types';

// Inject service based on environment flag
let _serviceInstance: IAmlService | null = null;

export function getAmlService(): IAmlService {
  if (!_serviceInstance) {
    _serviceInstance = isDemoMode() ? new MockAmlService() : new RealAmlService();
  }
  return _serviceInstance;
}
