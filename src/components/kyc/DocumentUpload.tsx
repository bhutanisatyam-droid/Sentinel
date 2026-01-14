import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle, X, CreditCard, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  onComplete: (front: File, back: File | null, secondaryId: File, data: {
    panNumber: string;
    secondaryIdType: string;
    secondaryIdNumber: string;
  }) => void;
}

type SecondaryIdType = 'aadhaar' | 'passport' | 'driving-license' | '';

// Verhoeff Algorithm for Aadhaar validation
const verhoeffMultiplicationTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const verhoeffPermutationTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

const verhoeffInverseTable = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateVerhoeffChecksum(num: string): boolean {
  if (!num || num.length !== 12) return false;

  let checksum = 0;
  const digits = num.split('').map(d => parseInt(d, 10)).reverse();

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    const permutedDigit = verhoeffPermutationTable[(i + 1) % 8][digit];
    checksum = verhoeffMultiplicationTable[checksum][permutedDigit];
  }

  return checksum === 0;
}

export function DocumentUpload({ onComplete }: DocumentUploadProps) {
  // PAN Card State
  const [panNumber, setPanNumber] = useState('');
  const [panFront, setPanFront] = useState<File | null>(null);
  const [panError, setPanError] = useState('');

  // Secondary ID State
  const [secondaryIdType, setSecondaryIdType] = useState<SecondaryIdType>('');
  const [secondaryIdNumber, setSecondaryIdNumber] = useState('');
  const [secondaryIdDoc, setSecondaryIdDoc] = useState<File | null>(null);
  const [secondaryIdError, setSecondaryIdError] = useState('');

  // Refs
  const panFrontRef = useRef<HTMLInputElement>(null);
  const secondaryIdRef = useRef<HTMLInputElement>(null);

  // PAN validation
  const validatePAN = (pan: string): boolean => {
    // Expanded status codes: P=Person, C=Company, F=Firm, H=HUF, T=Trust, A=AOP, B=BOI, L=Local Authority, J=Artificial Juridical Person, G=Govt
    const panRegex = /^[A-Z]{3}[PCFHTABLJG]{1}[A-Z]{1}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const handlePanNumberChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setPanNumber(upperValue);
    if (value && !validatePAN(upperValue)) {
      setPanError('Invalid PAN format. Example: ABCPE1234F');
    } else {
      setPanError('');
    }
  };

  // Secondary ID validation
  const validateSecondaryId = (type: SecondaryIdType, id: string): boolean => {
    switch (type) {
      case 'aadhaar':
        // For Hackathon: Just check for 12 digits (removed complex Verhoeff checksum)
        const aadhaarRegex = /^\d{12}$/;
        return aadhaarRegex.test(id);

      case 'driving-license':
        // Format: SS-RR-YYYY-NNNNNNN (15-16 characters)
        const dlRegex = /^[A-Z]{2}[-\s]?\d{2}[-\s]?\d{4}[-\s]?\d{7}$/;
        return dlRegex.test(id.toUpperCase());

      case 'passport':
        // Format: 8 characters, first is alphabet, next 7 are digits
        const passportRegex = /^[A-Z]{1}\d{7}$/;
        return passportRegex.test(id.toUpperCase());

      default:
        return false;
    }
  };

  const getSecondaryIdPlaceholder = (type: SecondaryIdType): string => {
    switch (type) {
      case 'aadhaar':
        return '234123412346';
      case 'driving-license':
        return 'MH-01-2020-1234567';
      case 'passport':
        return 'J1234567';
      default:
        return 'Select ID type first';
    }
  };

  const getSecondaryIdErrorMessage = (type: SecondaryIdType): string => {
    switch (type) {
      case 'aadhaar':
        return 'Invalid Aadhaar format (must be 12 digits)';
      case 'driving-license':
        return 'Invalid DL format (e.g., MH-01-2020-1234567)';
      case 'passport':
        return 'Invalid Passport format (e.g., J1234567)';
      default:
        return 'Invalid ID format';
    }
  };

  const getSecondaryIdHelpText = (type: SecondaryIdType): string => {
    switch (type) {
      case 'aadhaar':
        return 'Any 12-digit number is accepted for testing';
      case 'driving-license':
        return 'Format: State-RTO-Year-Number';
      case 'passport':
        return 'Valid test: J1234567 or K9876543';
      default:
        return '';
    }
  };

  const handleSecondaryIdNumberChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/\s+/g, '');
    setSecondaryIdNumber(upperValue);
    if (value && secondaryIdType && !validateSecondaryId(secondaryIdType, upperValue)) {
      setSecondaryIdError(getSecondaryIdErrorMessage(secondaryIdType));
    } else {
      setSecondaryIdError('');
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
    }
  };

  const handleSubmit = () => {
    let hasError = false;

    // Validate PAN
    if (!panNumber || !validatePAN(panNumber)) {
      setPanError('Valid PAN Card number is required');
      hasError = true;
    }
    if (!panFront) {
      setPanError('PAN Card front side is required');
      hasError = true;
    }

    // Validate Secondary ID
    if (!secondaryIdType) {
      setSecondaryIdError('Please select a secondary ID type');
      hasError = true;
    }
    if (!secondaryIdNumber || !validateSecondaryId(secondaryIdType, secondaryIdNumber)) {
      setSecondaryIdError('Valid secondary ID number is required');
      hasError = true;
    }
    if (!secondaryIdDoc) {
      setSecondaryIdError('Secondary ID document is required');
      hasError = true;
    }

    if (!hasError && panFront && secondaryIdDoc) {
      onComplete(panFront, null, secondaryIdDoc, {
        panNumber,
        secondaryIdType,
        secondaryIdNumber,
      });
    }
  };

  const isFormValid =
    panNumber &&
    validatePAN(panNumber) &&
    panFront &&
    secondaryIdType &&
    secondaryIdNumber &&
    validateSecondaryId(secondaryIdType, secondaryIdNumber) &&
    secondaryIdDoc;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
          Upload Identity Documents
        </h2>
        <p className="text-sm text-[#888888]">
          Please provide your PAN Card and one additional government-issued ID
        </p>
      </motion.div>

      {/* Demo Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center mb-6"
      >
        <button
          onClick={() => {
            const dummyFile = new File(["dummy"], "demo-document.jpg", { type: "image/jpeg" });
            setPanNumber('ABCPE1234F');
            setPanFront(dummyFile);
            setSecondaryIdType('aadhaar');
            setSecondaryIdNumber('123456789012');
            setSecondaryIdDoc(dummyFile);
            setPanError('');
            setSecondaryIdError('');
          }}
          className="px-4 py-2 bg-[#222222] border border-[#333333] rounded text-xs text-[#EDEDED] hover:bg-[#333333] transition-colors flex items-center gap-2"
        >
          <FileText className="w-3 h-3" />
          Fill Demo Data
        </button>
      </motion.div>

      {/* PAN Card Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-[#222222] rounded p-6 mb-6 bg-[#050505]"
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-white" strokeWidth={1.5} />
          <h3 className="text-sm font-medium text-[#EDEDED]">
            PAN Card (Primary ID) <span className="text-red-500">*</span>
          </h3>
        </div>

        {/* PAN Number Input */}
        <div className="mb-4">
          <label className="block text-xs mb-2 text-[#888888]">PAN Card Number</label>
          <input
            type="text"
            value={panNumber}
            onChange={(e) => handlePanNumberChange(e.target.value)}
            placeholder="ABCPE1234F"
            maxLength={10}
            className={`w-full bg-black border ${panError ? 'border-red-500' : 'border-[#222222]'} rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED] uppercase`}
          />
          {panError && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <p className="text-xs text-red-500">{panError}</p>
            </div>
          )}
          <p className="text-xs text-[#888888] mt-1">
            Format: 3 letters + status (P/C/F/H/T/A/B/L/J/G) + letter + 4 digits + letter
          </p>
          <p className="text-xs text-[#666666] mt-1">
            Valid test example: ABCPE1234F
          </p>
        </div>

        {/* PAN Card Upload */}
        <div className="grid grid-cols-1 gap-4">
          {/* Front Side */}
          <div>
            <label className="block text-xs mb-2 text-[#888888]">Front Side</label>
            <div
              onClick={() => panFrontRef.current?.click()}
              className="border-2 border-dashed border-[#222222] rounded p-6 text-center cursor-pointer hover:border-white transition-colors bg-black"
            >
              <input
                ref={panFrontRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, setPanFront)}
                className="hidden"
              />
              {panFront ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto text-white" strokeWidth={1.5} />
                  <p className="text-xs text-white truncate">{panFront.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPanFront(null);
                    }}
                    className="text-xs text-[#888888] hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-[#888888]" strokeWidth={1.5} />
                  <p className="text-xs text-[#EDEDED]">Upload Front</p>
                  <p className="text-xs text-[#888888]">PNG, JPG, PDF</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Secondary ID Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border border-[#222222] rounded p-6 mb-6 bg-[#050505]"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-white" strokeWidth={1.5} />
          <h3 className="text-sm font-medium text-[#EDEDED]">
            Secondary ID <span className="text-red-500">*</span>
          </h3>
        </div>

        {/* ID Type Selection */}
        <div className="mb-4">
          <label className="block text-xs mb-2 text-[#888888]">Select ID Type</label>
          <select
            value={secondaryIdType}
            onChange={(e) => {
              setSecondaryIdType(e.target.value as SecondaryIdType);
              setSecondaryIdNumber('');
              setSecondaryIdError('');
            }}
            className="w-full bg-black border border-[#222222] rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED]"
          >
            <option value="">Choose ID Type</option>
            <option value="aadhaar">Aadhaar Card</option>
            <option value="passport">Passport</option>
            <option value="driving-license">Driving License</option>
          </select>
        </div>

        {/* ID Number Input */}
        {secondaryIdType && (
          <div className="mb-4">
            <label className="block text-xs mb-2 text-[#888888]">
              {secondaryIdType === 'aadhaar' && 'Aadhaar Number'}
              {secondaryIdType === 'passport' && 'Passport Number'}
              {secondaryIdType === 'driving-license' && 'Driving License Number'}
            </label>
            <input
              type="text"
              value={secondaryIdNumber}
              onChange={(e) => handleSecondaryIdNumberChange(e.target.value)}
              placeholder={getSecondaryIdPlaceholder(secondaryIdType)}
              className={`w-full bg-black border ${secondaryIdError ? 'border-red-500' : 'border-[#222222]'} rounded px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors text-[#EDEDED] uppercase`}
            />
            {secondaryIdError && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <p className="text-xs text-red-500">{secondaryIdError}</p>
              </div>
            )}
            <p className="text-xs text-[#666666] mt-1">
              {getSecondaryIdHelpText(secondaryIdType)}
            </p>
          </div>
        )}

        {/* Document Upload */}
        {secondaryIdType && (
          <div>
            <label className="block text-xs mb-2 text-[#888888]">Upload Document</label>
            <div
              onClick={() => secondaryIdRef.current?.click()}
              className="border-2 border-dashed border-[#222222] rounded p-8 text-center cursor-pointer hover:border-white transition-colors bg-black"
            >
              <input
                ref={secondaryIdRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, setSecondaryIdDoc)}
                className="hidden"
              />
              {secondaryIdDoc ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 mx-auto text-white" strokeWidth={1.5} />
                  <p className="text-sm text-white">{secondaryIdDoc.name}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSecondaryIdDoc(null);
                    }}
                    className="text-xs text-[#888888] hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 mx-auto text-[#888888]" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm text-[#EDEDED] mb-1">Click to upload</p>
                    <p className="text-xs text-[#888888]">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border border-[#222222] rounded p-6 mb-8 bg-[#050505]"
      >
        <h3 className="text-sm font-medium mb-4 text-[#EDEDED]">Tips for best results</h3>
        <ul className="space-y-2 text-xs text-[#888888]">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span>Ensure all text is clearly visible and in focus</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span>Place document on a dark, plain background</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span>Avoid glare and shadows on the document</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <span>Double-check ID numbers for accuracy</span>
          </li>
        </ul>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        whileHover={{ scale: isFormValid ? 1.01 : 1 }}
        whileTap={{ scale: isFormValid ? 0.99 : 1 }}
        onClick={handleSubmit}
        disabled={!isFormValid}
        className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue to Liveness Check
      </motion.button>
    </div>
  );
}