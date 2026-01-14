import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, CheckCircle } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { LivenessCheck } from './LivenessCheck';
import { OCRVerification } from './OCRVerification';
import { WatchlistScreen } from './WatchlistScreen';
import { KYCResult } from './KYCResult';

interface KYCFlowProps {
  user: any; // Added user prop
  onComplete: () => void;
  onCancel: () => void;
}

export function KYCFlow({ user, onComplete, onCancel }: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<{
    front: File | null;
    back: File | null;
    secondaryId: File | null; // Added
    liveCapture: File | null; // Added
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
  } | null>(null);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [watchlistComplete, setWatchlistComplete] = useState(false);

  const steps = [
    { id: 1, name: 'Document Upload', status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'current' : 'upcoming' },
    { id: 2, name: 'Liveness Check', status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'current' : 'upcoming' },
    { id: 3, name: 'OCR Verification', status: currentStep > 3 ? 'complete' : currentStep === 3 ? 'current' : 'upcoming' },
    { id: 4, name: 'Watchlist Screen', status: currentStep > 4 ? 'complete' : currentStep === 4 ? 'current' : 'upcoming' },
    { id: 5, name: 'Verification', status: currentStep === 5 ? 'current' : 'upcoming' },
  ];

  const handleDocumentComplete = (front: File, back: File | null, secondaryId: File, data: {
    panNumber: string;
    secondaryIdType: string;
    secondaryIdNumber: string;
  }) => {
    setDocuments(prev => ({ ...prev, front, back, secondaryId }));
    setDocumentData(data);
    setCurrentStep(2);
  };

  const handleLivenessComplete = (file: File) => {
    setDocuments(prev => ({ ...prev, liveCapture: file }));
    setLivenessComplete(true);
    setCurrentStep(3);
  };

  const handleOCRVerificationComplete = (data: any) => {
    setVerifiedData(data);
    setCurrentStep(4);
  };

  const handleWatchlistComplete = () => {
    setWatchlistComplete(true);
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
          {currentStep === 1 && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DocumentUpload onComplete={handleDocumentComplete} />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="liveness"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <LivenessCheck onComplete={handleLivenessComplete} />
            </motion.div>
          )}

          {currentStep === 3 && (
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

          {currentStep === 4 && (
            <motion.div
              key="watchlist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <WatchlistScreen onComplete={handleWatchlistComplete} />
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <KYCResult onComplete={onComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}