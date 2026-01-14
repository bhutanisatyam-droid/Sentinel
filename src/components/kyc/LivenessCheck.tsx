import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Camera, CheckCircle, AlertCircle, Eye, Zap } from 'lucide-react';
import * as faceapi from 'face-api.js';

interface LivenessCheckProps {
  onComplete: (file: File) => void;
}

export function LivenessCheck({ onComplete }: LivenessCheckProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>("Initializing AI...");
  const [challengeStep, setChallengeStep] = useState<"loading" | "center" | "blink" | "success">("loading");
  const [debugEAR, setDebugEAR] = useState<string>("0.00");
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastValidDetectionRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const challengeStepRef = useRef<"loading" | "center" | "blink" | "success">("loading");
  const hasOpenedEyesRef = useRef<boolean>(false);
  const capturedImageRef = useRef<File | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelPath = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        ]);
        setModelsLoaded(true);
        setDetectionStatus("AI Models Loaded. Ready.");
      } catch (err) {
        console.error("Model Load Error:", err);
        setDetectionStatus("Error loading AI models.");
        setModelLoadError("Failed to load AI models. Please refresh.");
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    setShowInstructions(false);
    setIsCapturing(true);
    setChallengeStep("loading");
    challengeStepRef.current = "loading";
    setDetectionStatus("Starting Camera...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      // Fallback for demo
      alert("Camera access failed. Switching to simulation mode for demo.");
      handleSkip();
    }
  };

  const handleSkip = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    // Create dummy file for skip
    const dummyFile = new File(["dummy"], "simulation.jpg", { type: "image/jpeg" });
    onComplete(dummyFile);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    // Capture from video
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "liveness.jpg", { type: "image/jpeg" });
          capturedImageRef.current = file;

          if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

          setTimeout(() => {
            onComplete(file);
          }, 1500);
        }
      }, 'image/jpeg');
    }
  }, [onComplete]);

  const getDistance = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  useEffect(() => {
    if (!isCapturing || !modelsLoaded) return;

    const startDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const displaySize = { width: 640, height: 480 };
      faceapi.matchDimensions(canvasRef.current, displaySize);
      setChallengeStep("center");
      challengeStepRef.current = "center";

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        try {
          const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })).withFaceLandmarks();
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if (detections) {
            lastValidDetectionRef.current = Date.now();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            // Optional: Draw landmarks
            // faceapi.draw.drawFaceLandmarks(canvasRef.current!, resizedDetections);

            processChallenge(resizedDetections);
          } else {
            if (Date.now() - lastValidDetectionRef.current > 2000) {
              setDetectionStatus("No face detected. Move closer.");
            }
          }
        } catch (err) { console.warn("Detection error:", err); }
      }, 100);
    };

    const processChallenge = (detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>) => {
      const currentStep = challengeStepRef.current;
      if (!detection) return;
      setDetectionStatus(prev => prev.includes("No face") ? " " : prev);
      const { x, y, width, height } = detection.detection.box;

      if (currentStep === "center") {
        const faceCenterX = x + width / 2;
        const faceCenterY = y + height / 2;
        const isCenteredX = Math.abs(faceCenterX - 320) < 150;
        const isCenteredY = Math.abs(faceCenterY - 240) < 150;
        const isBigEnough = width > 120;

        if (isCenteredX && isCenteredY && isBigEnough) {
          setDetectionStatus("Excellent! Now BLINK your eyes.");
          setChallengeStep("blink");
          challengeStepRef.current = "blink";
          hasOpenedEyesRef.current = false; // Reset for new attempt
        } else {
          setDetectionStatus(isBigEnough ? "Center your face in the circle" : "Move Closer");
        }
      }

      if (currentStep === "blink") {
        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const getEAR = (points: any[]) => {
          const dA = getDistance(points[1], points[5]);
          const dB = getDistance(points[2], points[4]);
          const dC = getDistance(points[0], points[3]);
          if (dC === 0) return 0;
          return (dA + dB) / (2 * dC);
        };
        const avgEAR = (getEAR(leftEye) + getEAR(rightEye)) / 2;
        setDebugEAR(avgEAR.toFixed(3));

        const OPEN_THRESHOLD = 0.28;
        const BLINK_THRESHOLD = 0.24;

        if (avgEAR > OPEN_THRESHOLD) {
          hasOpenedEyesRef.current = true;
          setDetectionStatus(`Eyes Open! Ready to Blink. (EAR: ${avgEAR.toFixed(3)})`);
        } else if (avgEAR < BLINK_THRESHOLD && hasOpenedEyesRef.current) {
          setDetectionStatus("Blink Detected! Capturing...");
          setChallengeStep("success");
          challengeStepRef.current = "success";
          capturePhoto();
        } else if (!hasOpenedEyesRef.current) {
          setDetectionStatus(`Open Eyes Wider... (Target: > ${OPEN_THRESHOLD})`);
        } else {
          setDetectionStatus(`Now Blink! (Target: < ${BLINK_THRESHOLD})`);
        }
      }
    };

    if (videoRef.current && !videoRef.current.paused) startDetection();
    else if (videoRef.current) videoRef.current.addEventListener('play', startDetection);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current) videoRef.current.removeEventListener('play', startDetection);
    };
  }, [isCapturing, modelsLoaded, capturePhoto]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
          Liveness Verification
        </h2>
        <p className="text-sm text-[#888888]">
          Quick biometric check to verify you're a real person
        </p>
      </motion.div>

      {showInstructions ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="border border-[#222222] rounded p-8 bg-[#050505]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-[#222222] flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-medium mb-4 text-center text-[#EDEDED]">Instructions</h3>
            <ul className="space-y-3 text-xs text-[#888888]">
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" strokeWidth={1.5} />
                <span>Ensure good lighting and remove glasses</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" strokeWidth={1.5} />
                <span>Center your face in the circle</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" strokeWidth={1.5} />
                <span>Blink clearly when prompted</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={startCamera}
              disabled={!modelsLoaded}
              className="w-full bg-white text-black py-3 rounded text-sm hover:bg-[#EDEDED] transition-colors disabled:opacity-50"
            >
              {modelsLoaded ? "Start Verification" : "Loading AI Models..."}
            </motion.button>
            <button
              onClick={handleSkip}
              className="w-full text-xs text-[#888888] hover:text-white transition-colors"
            >
              Skip for Demo
            </button>
          </div>
          <p className="text-center text-xs text-red-500">{modelLoadError}</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="relative rounded overflow-hidden border-4 border-[#222222] bg-black" style={{ height: '480px', width: '640px', margin: '0 auto' }}>
            {challengeStep === 'success' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-50">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckCircle className="w-20 h-20 text-[#4ade80]" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-xl font-medium mt-4 text-[#EDEDED]">Verified!</h3>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  width={640}
                  height={480}
                  className="absolute object-cover transform scale-x-[-1]"
                />
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="absolute inset-0 z-10 transform scale-x-[-1]"
                />

                {/* Status Overlays */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full z-20 font-medium text-sm pointer-events-none whitespace-nowrap border border-[#333333]">
                  {detectionStatus}
                </div>

                <div className="absolute top-16 left-4 bg-black/70 text-lime-400 p-3 rounded z-20 text-xs font-mono text-left pointer-events-none border border-[#333333]">
                  <p>Step: {challengeStep}</p>
                  <p>EAR: {debugEAR}</p>
                </div>

                {/* Target Frame */}
                <div
                  className={`absolute border-[4px] border-dashed rounded-full pointer-events-none transition-all duration-300 z-30`}
                  style={{
                    width: '280px',
                    height: '380px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderColor: challengeStep === 'blink' ? '#4ade80' : '#facc15', // GREEN or YELLOW
                    backgroundColor: challengeStep === 'blink' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(250, 204, 21, 0.05)'
                  }}
                >
                  {challengeStep === 'blink' && (
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
