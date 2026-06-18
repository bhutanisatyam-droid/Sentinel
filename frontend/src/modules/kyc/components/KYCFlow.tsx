import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, CheckCircle } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { OCRVerification } from './OCRVerification';
import { LivenessCheck } from './LivenessCheck';
import { FaceMatch } from './FaceMatch';
import { KYCResult } from './KYCResult';
import { useGeolocation } from '../../hooks/useGeolocation';

interface KYCFlowProps {
  user: any;
  onComplete: (kycData: any) => void;
  onCancel: () => void;
}

export function KYCFlow({ user, onComplete, onCancel }: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<{
    front: File | null;
    back: File | null;
    secondaryId: File | null;
    liveCapture: File | null;
  }>({
    front: null,
    back: null,
    secondaryId: null,
    liveCapture: null
  });
  const [documentData, setDocumentData] = useState<{
    panNumber: string;
    secondaryIdType: string;
    secondaryIdNumber: string;
    occupation: string;
    geoParams?: any;
  } | null>(null);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  
  const geo = useGeolocation();

  // New 5-step flow:
  // 1 = Document Upload
  // 2 = Review OCR Data
  // 3 = Liveness Check
  // 4 = Face Matching
  // 5 = Result
  const steps = [
    { id: 1, name: 'Document Upload', status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'current' : 'upcoming' },
    { id: 2, name: 'Review Data', status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'current' : 'upcoming' },
    { id: 3, name: 'Liveness Check', status: currentStep > 3 ? 'complete' : currentStep === 3 ? 'current' : 'upcoming' },
    { id: 4, name: 'Face Matching', status: currentStep > 4 ? 'complete' : currentStep === 4 ? 'current' : 'upcoming' },
    { id: 5, name: 'Verification', status: currentStep === 5 ? 'current' : 'upcoming' },
  ];

  // Step 1 → 2: Document files captured, move to OCR review
  const handleDocumentComplete = (front: File, back: File | null, secondaryId: File, data: {
    panNumber: string;
    secondaryIdType: string;
    secondaryIdNumber: string;
    occupation: string;
    geoParams?: any;
  }) => {
    setDocuments(prev => ({ ...prev, front, back, secondaryId }));
    setDocumentData(data);
    setCurrentStep(2);
  };

  // Step 2 → 3: OCR data confirmed, move to liveness
  const handleOCRVerificationComplete = (data: any) => {
    setVerifiedData(data);
    setCurrentStep(3);
  };

  // Step 3 → 4: Liveness selfie captured, move to face matching
  const handleLivenessComplete = (file: File) => {
    setDocuments(prev => ({ ...prev, liveCapture: file }));
    setCurrentStep(4);
  };

  // Step 4 → 5: Face match complete, move to result
  const handleFaceMatchComplete = (data: any) => {
    setVerifiedData((prev: any) => ({
      ...prev,
      ...data,
      faceMatchDetails: data // ensure we don't clobber the OCR 'fullName'
    }));
    setCurrentStep(5);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-[#222222] bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-white" strokeWidth={1.5} />
            <span className="text-sm font-medium tracking-tight">Sentinel</span>
          </div>
          <button
            onClick={onCancel}
            className="text-[#888888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-[#222222] bg-[#050505]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-1">
                  <motion.div
                    initial={false}
                    animate={{
                      borderColor: step.status === 'complete' ? '#EDEDED' : step.status === 'current' ? '#EDEDED' : '#222222',
                      backgroundColor: step.status === 'complete' ? '#EDEDED' : step.status === 'current' ? 'transparent' : 'transparent',
                    }}
                    className="w-8 h-8 rounded-full border flex items-center justify-center relative"
                  >
                    {step.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-black" strokeWidth={2} fill="#EDEDED" />
                    ) : (
                      <span className={`text-xs ${step.status === 'current' ? 'text-white' : 'text-[#888888]'}`}>
                        {step.id}
                      </span>
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <p className={`text-xs ${step.status === 'current' ? 'text-white' : 'text-[#888888]'}`}>
                      {step.name}
                    </p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-[1px] bg-[#222222] mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Document Upload */}
          {currentStep === 1 && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DocumentUpload onComplete={handleDocumentComplete} geo={geo} />
            </motion.div>
          )}

          {/* Step 2: Review Extracted OCR Data */}
          {currentStep === 2 && (
            <motion.div
              key="ocr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OCRVerification
                user={user}
                documents={documents}
                onComplete={handleOCRVerificationComplete}
                inputData={documentData}
              />
            </motion.div>
          )}

          {/* Step 3: Liveness Check */}
          {currentStep === 3 && (
            <motion.div
              key="liveness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <LivenessCheck onComplete={handleLivenessComplete} />
            </motion.div>
          )}

          {/* Step 4: Face Matching */}
          {currentStep === 4 && (
            <motion.div
              key="facematch"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FaceMatch
                user={user}
                documents={documents}
                inputData={documentData ? {
                  ...documentData,
                  name: verifiedData?.verificationDetails?.fullName || verifiedData?.fullName || verifiedData?.name || "Demo User"
                } : null}
                onComplete={handleFaceMatchComplete}
              />
            </motion.div>
          )}

          {/* Step 5: Final Result */}
          {currentStep === 5 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <KYCResult onComplete={() => onComplete({ ...documentData, verificationDetails: verifiedData })} verifiedData={verifiedData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}