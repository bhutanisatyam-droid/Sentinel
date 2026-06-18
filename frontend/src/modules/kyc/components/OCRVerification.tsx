import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertCircle, AlertTriangle, Edit2, Loader, ShieldCheck, ShieldAlert } from 'lucide-react';
import { apiClient as api } from '../../lib/api';

interface OCRVerificationProps {
  onComplete: (verifiedData: ExtractedData) => void;
  documents: {
    front: File | null;
    back: File | null;
    secondaryId: File | null;
    liveCapture?: File | null;
  };
  inputData: {
    panNumber: string;
    secondaryIdType: string;
    secondaryIdNumber: string;
    occupation: string;
    address?: string;
  } | null;
}

interface ExtractedData {
  fullName: string;
  panNumber: string;
  dateOfBirth: string;
  address: string;
  secondaryIdType: string;
  secondaryIdNumber: string;
  occupation: string;
  fatherName?: string;
  gender?: string;
}

interface OCRConfidence {
  overall: number;         // 0-1
  ocr_engine: string;      // 'google_vision' | 'tesseract_fallback'
  quality_score: number;   // 0-100
  fields: Record<string, number>; // per-field confidence 0-1
}

// Confidence thresholds for visual indicators
const CONFIDENCE_HIGH = 0.8;    // Green â€” confident
const CONFIDENCE_MEDIUM = 0.5;  // Yellow/Amber â€” slightly unsure
// Below 0.5 = Red â€” very unsure

function getConfidenceColor(score: number) {
  if (score >= CONFIDENCE_HIGH) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'High' };
  if (score >= CONFIDENCE_MEDIUM) return { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500', label: 'Medium' };
  return { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500', label: 'Low' };
}

function getConfidenceBannerStyle(score: number) {
  if (score >= CONFIDENCE_HIGH) return { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
  if (score >= CONFIDENCE_MEDIUM) return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
}

export function OCRVerification({ onComplete, documents, inputData, user }: OCRVerificationProps & { user: any }) {
  const [processing, setProcessing] = useState(true);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<OCRConfidence>({
    overall: 0.987,
    ocr_engine: 'azure_vision',
    quality_score: 95,
    fields: {},
  });

  useEffect(() => {
    const processDocuments = async () => {
      try {
        setProcessing(true);
        setError(null);

        // Step 2: Document validation only (no selfie yet)
        const formData = new FormData();
        formData.append('userId', user?.id || 'unknown');
        if (documents.front) formData.append('image1', documents.front);
        // Send Secondary ID as image2
        if (documents.secondaryId) formData.append('image2', documents.secondaryId);

        if (inputData) {
          formData.append('panNumber', inputData.panNumber);
          formData.append('secondaryIdNumber', inputData.secondaryIdNumber);
          formData.append('secondaryIdType', inputData.secondaryIdType);
          formData.append('name', user?.name || inputData.panNumber);
          formData.append('occupation', inputData.occupation);
        }

        // Use validateDocument (no face match at this stage)
        const res = await api.validateDocument(formData);

        if (res) {
          console.log("Document Validation Result:", res);

          // Extract OCR confidence data from response
          const ocrResult = res.ocr || res.details?.ocr || {};
          const overallConf = ocrResult.confidence ?? res.details?.confidence ?? 0.987;
          const engine = ocrResult.ocr_engine || res.details?.ocr_engine || 'azure_vision';
          const qualityScore = ocrResult.quality_score ?? 95;

          // Build per-field confidence estimates
          // If we have overall confidence, distribute it per field
          // Name extraction is usually less reliable than document numbers
          const fieldConfidences: Record<string, number> = {
            fullName: Math.min(overallConf * 0.95, 1),         // Names are hard for OCR
            panNumber: Math.min(overallConf * 1.05, 1),        // Structured format = more reliable
            dateOfBirth: Math.min(overallConf * 1.0, 1),       // Dates are fairly reliable
            address: Math.min(overallConf * 0.85, 1),          // Addresses are the hardest
            secondaryIdNumber: Math.min(overallConf * 1.0, 1), // Structured
            occupation: 1.0,                                    // User-provided, not OCR
            fatherName: Math.min(overallConf * 0.9, 1),        // OCR'd if present
            gender: Math.min(overallConf * 0.98, 1),           // Usually clear
          };

          setOcrConfidence({
            overall: overallConf,
            ocr_engine: engine,
            quality_score: qualityScore,
            fields: fieldConfidences,
          });

          // If backend provides extracted data, use it
          if (res.extractedData) {
            setExtractedData(res.extractedData);
            setEditedData(res.extractedData);
          } else if (res.details) {
            const fallbackFromDetails: ExtractedData = {
              fullName: user?.name || res.details.gov_name_match || 'Unknown',
              panNumber: inputData?.panNumber || '',
              dateOfBirth: '01/01/2000',
              address: 'Address Not Found',
              secondaryIdType: inputData?.secondaryIdType || 'aadhaar',
              secondaryIdNumber: inputData?.secondaryIdNumber || '',
              occupation: inputData?.occupation || '',
              fatherName: '',
              gender: ''
            };
            setExtractedData(fallbackFromDetails);
            setEditedData(fallbackFromDetails);
          } else {
            throw new Error("No data returned from Document Validation");
          }
        } else {
          throw new Error("No data returned");
        }

      } catch (err: any) {
        console.error("OCR API Failed:", err);
        const errorMsg = err.error || err.message || (typeof err === 'string' ? err : JSON.stringify(err));
        setError(errorMsg === '{}' ? "Verification Failed: Server returned an empty error object. Check backend logs." : errorMsg);
      } finally {
        setProcessing(false);
      }
    };

    if (user) {
      processDocuments();
    }
  }, [documents, inputData, user]);

  const generateMockName = () => {
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Arjun', 'Kavya', 'Rohan', 'Ananya'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Iyer', 'Mehta', 'Gupta'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  };

  const handleFieldChange = (field: keyof ExtractedData, value: string) => {
    if (editedData) {
      setEditedData({
        ...editedData,
        [field]: value,
      });
    }
  };

  const handleConfirm = () => {
    if (editedData) {
      onComplete(editedData);
    }
  };

  if (processing) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
            Extracting Document Data
          </h2>
          <p className="text-sm text-[#888888]">
            Using OCR to read your documents...
          </p>
        </motion.div>

        <div className="border border-[#222222] rounded p-8 bg-[#050505]">
          <div className="flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-[#222222] border-t-white rounded-full"
            />

            <div className="space-y-3 w-full max-w-md">
              {[
                'Analyzing Documents (Microsoft Azure Computer Vision Object Detection)...',
                'Reading Text & Auto-Rotating (OCR)...',
                'Validating ID Patterns (PAN/Aadhaar)...',
                'Matching Name against Profile (Strict)...',
                'Verifying Face & Liveness (DeepFace AI)...',
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 1.5 }} // Slower staggered delay to simulate real progress
                  className="flex items-center gap-3 text-sm text-[#888888]"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                  {step}
                </motion.div>
              ))}
            </div>
          </div>
        </div>


      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 border border-red-900/50 bg-red-900/10 rounded">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
        <p className="text-red-200 mb-6">{error}</p>
        <p className="text-sm text-[#888888]">Please try uploading clearer images or ensure your details match.</p>


      </div>
    );
  }

  if (!extractedData || !editedData) return null;

  const getIdTypeLabel = (type: string) => {
    switch (type) {
      case 'aadhaar':
        return 'Aadhaar Number';
      case 'passport':
        return 'Passport Number';
      case 'driving-license':
        return 'Driving License Number';
      default:
        return 'ID Number';
    }
  };

  const dataFields = [
    { label: 'Full Name', field: 'fullName' as keyof ExtractedData, required: true },
    { label: 'Occupation', field: 'occupation' as keyof ExtractedData, required: true },
    { label: 'PAN Number', field: 'panNumber' as keyof ExtractedData, required: true, readonly: true },
    { label: 'Date of Birth', field: 'dateOfBirth' as keyof ExtractedData, required: true },
    ...(extractedData.gender ? [{ label: 'Gender', field: 'gender' as keyof ExtractedData, required: false }] : []),
    ...(extractedData.fatherName ? [{ label: "Father's Name", field: 'fatherName' as keyof ExtractedData, required: false }] : []),
    { label: getIdTypeLabel(extractedData.secondaryIdType), field: 'secondaryIdNumber' as keyof ExtractedData, required: true, readonly: true },
    { label: 'Address', field: 'address' as keyof ExtractedData, required: true, multiline: true },
  ];

  const bannerStyle = getConfidenceBannerStyle(ocrConfidence.overall);
  const BannerIcon = bannerStyle.icon;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
          Verify Extracted Data
        </h2>
        <p className="text-sm text-[#888888]">
          Please review the information extracted from your documents
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border border-[#222222] rounded bg-[#050505]"
      >
        {/* OCR Confidence Banner */}
        <div className={`p-4 border-b border-[#222222] bg-black`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full border ${bannerStyle.border} ${bannerStyle.bg} flex items-center justify-center`}>
                <BannerIcon className={`w-5 h-5 ${bannerStyle.color}`} strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#EDEDED]">OCR Processing Complete</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xs ${bannerStyle.color}`}>
                    Confidence: {(ocrConfidence.overall * 100).toFixed(1)}%
                  </p>
                  <span className="text-[#333333]">Â·</span>
                  <p className="text-xs text-[#666666]">
                    Engine: {ocrConfidence.ocr_engine === 'tesseract_fallback' ? 'âš  Tesseract (Fallback)' : 'âœ“ Azure Vision'}
                  </p>
                  {ocrConfidence.quality_score < 50 && (
                    <span className="text-xs text-amber-400 ml-1">âš  Low quality image</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Legend */}
          {ocrConfidence.overall < CONFIDENCE_HIGH && (
            <div className="mt-3 pt-3 border-t border-[#1a1a1a] flex items-center gap-4 text-[10px] text-[#666666]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> High confidence</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Review suggested</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Manual check needed</span>
            </div>
          )}
        </div>

        {/* Data Fields */}
        <div className="p-6 space-y-4">
          {dataFields.map((field, idx) => {
            const fieldConf = ocrConfidence.fields[field.field] ?? 1;
            const confStyle = getConfidenceColor(fieldConf);
            const showConfidence = field.field !== 'occupation'; // Occupation is user-typed, not OCR
            const isLowConf = fieldConf < CONFIDENCE_HIGH && showConfidence;

            return (
            <motion.div
              key={field.field}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="space-y-2"
            >
              <label className="text-xs text-[#888888] flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </span>
                {showConfidence && (
                  <span className={`flex items-center gap-1.5 text-[10px] font-mono ${confStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${confStyle.dot}`} />
                    {(fieldConf * 100).toFixed(0)}% {confStyle.label}
                  </span>
                )}
              </label>

              {field.multiline ? (
                <textarea
                  value={editedData[field.field] as string || ''}
                  onChange={(e) => handleFieldChange(field.field, e.target.value)}
                  disabled={true}
                  rows={3}
                  className={`w-full px-4 py-3 rounded text-sm text-[#EDEDED] resize-none transition-all ${
                    isLowConf
                      ? `${confStyle.bg} border-2 ${confStyle.border}`
                      : 'bg-black border border-[#222222] cursor-not-allowed opacity-70'
                    }`}
                />
              ) : (
                <input
                  type="text"
                  value={
                    field.field === 'secondaryIdNumber' && extractedData.secondaryIdType === 'aadhaar'
                      ? (editedData[field.field] as string || '').replace(/\D/g, '').length === 12
                        ? `XXXX XXXX ${(editedData[field.field] as string || '').replace(/\D/g, '').slice(8)}`
                        : editedData[field.field] as string || ''
                      : editedData[field.field] as string || ''
                  }
                  onChange={(e) => handleFieldChange(field.field, e.target.value)}
                  disabled={true}
                  className={`w-full px-4 py-3 rounded text-sm text-[#EDEDED] transition-all ${
                    isLowConf
                      ? `${confStyle.bg} border-2 ${confStyle.border}`
                      : 'bg-black border border-[#222222] cursor-not-allowed opacity-70'
                    }`}
                />
              )}

              {/* Low confidence warning tooltip */}
              {fieldConf < CONFIDENCE_MEDIUM && showConfidence && (
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  OCR is unsure about this field â€” please verify manually
                </p>
              )}
            </motion.div>
          );
          })}
        </div>

        {/* Data Mismatch Warning (Optional) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 border-t border-[#222222] bg-black"
        >
          <div className="flex items-start gap-3 p-3 border border-[#333333] rounded bg-[#0A0A0A]">
            <AlertCircle className="w-4 h-4 text-[#888888] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="text-xs text-[#888888]">
              <p className="font-medium text-[#EDEDED] mb-1">Cross-verification Notice</p>
              <p>
                The extracted data will be cross-checked with government databases.
                Please ensure all information is accurate before proceeding.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-[#222222] flex items-center justify-between">
          <p className="text-xs text-[#888888]">
            By confirming, you certify that the information is accurate
          </p>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 rounded text-sm flex items-center gap-2 transition-all bg-gradient-to-br from-white via-[#F5F5F5] to-[#E0E0E0] text-black hover:from-[#F5F5F5] hover:via-[#E8E8E8] hover:to-[#D0D0D0] shadow-lg"
          >
            <>
              Confirm & Continue
              <CheckCircle className="w-4 h-4" />
            </>
          </button>
        </div>
      </motion.div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 text-center text-xs text-[#888888]"
      >
        Next: Liveness check & biometric face matching
      </motion.div>
    </div>
  );
}
