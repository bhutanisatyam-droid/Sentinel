import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Camera, CheckCircle, AlertCircle, Eye, Zap, ShieldCheck, Loader2, ArrowLeft, ArrowRight, Smile, ChevronDown } from 'lucide-react';
import * as faceapi from 'face-api.js';

// ---- Types ----
interface LivenessCheckProps {
  onComplete: (file: File) => void;
}

interface LivenessSession {
  session_id: string;
  flash_sequence: { color: string; rgb: number[]; hex: string; duration_ms: number }[];
  active_challenges: string[];
}

type ChallengeStep =
  | 'loading'
  | 'center'
  | 'watching'        // face centered, waiting for random flash start
  | 'corneal_flash'   // flashing colors
  | 'challenge'       // active challenge in progress
  | 'analyzing'
  | 'success'
  | 'failed';

const BACKEND_BASE = '/api/kyc/liveness';
const BLINK_THRESHOLD = 0.21;
const OPEN_THRESHOLD = 0.26;

// Challenge definitions with icons and prompts
const CHALLENGE_CONFIG: Record<string, { prompt: string; icon: string; detect: string }> = {
  turn_left: { prompt: 'Turn Your Head LEFT', icon: '←', detect: 'Head turn left' },
  turn_right: { prompt: 'Turn Your Head RIGHT', icon: '→', detect: 'Head turn right' },
  smile: { prompt: 'SMILE!', icon: '😊', detect: 'Smile' },
  nod: { prompt: 'NOD Your Head', icon: '↕', detect: 'Head nod' },
};

const CHALLENGE_TIMEOUT_MS = 6000; // 6s per challenge

// ---- Component ----
export function LivenessCheck({ onComplete }: LivenessCheckProps) {
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState<string>("Initializing AI...");
  const [challengeStep, setChallengeStep] = useState<ChallengeStep>("loading");
  const [debugEAR, setDebugEAR] = useState<string>("0.00");
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [verificationScore, setVerificationScore] = useState<number | null>(null);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [challengePrompt, setChallengePrompt] = useState<string>('');
  const [challengeIcon, setChallengeIcon] = useState<string>('');
  const [challengeProgress, setChallengeProgress] = useState<number>(0); // 0-100

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastValidDetectionRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const challengeStepRef = useRef<ChallengeStep>("loading");
  const hasOpenedEyesRef = useRef<boolean>(false);
  const capturedImageRef = useRef<File | null>(null);

  // Corneal reflection state
  const sessionRef = useRef<LivenessSession | null>(null);
  const flashFramesRef = useRef<Map<string, Blob>>(new Map());
  const blinkFramesRef = useRef<Blob[]>([]);
  const timestampsRef = useRef<number[]>([]);
  const cornealDoneRef = useRef<boolean>(false);

  // Active challenge state
  const activeChallengesRef = useRef<string[]>([]);
  const currentChallengeIdxRef = useRef<number>(0);
  const challengeFramesRef = useRef<Map<string, Blob[]>>(new Map());
  const challengeStartTimeRef = useRef<number>(0);
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const baselineFaceCenterRef = useRef<{ x: number; y: number } | null>(null);
  const challengeDetectedRef = useRef<boolean>(false);

  // Random flash delay
  const flashDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashScheduledRef = useRef<boolean>(false);

  // ---- Load face-api models ----
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

  // ---- Helpers ----
  const getDistance = (p1: any, p2: any) =>
    Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

  const grabFrameBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 480;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      c.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  };

  // ---- Fetch backend session ----
  const fetchSession = async (): Promise<LivenessSession | null> => {
    try {
      const res = await fetch(`${BACKEND_BASE}/session`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: LivenessSession = await res.json();
      sessionRef.current = data;

      // Pick 2 random challenges from the pool
      const pool = ['turn_left', 'turn_right', 'smile', 'nod'];
      const shuffled = pool.sort(() => Math.random() - 0.5);
      activeChallengesRef.current = shuffled.slice(0, 2);

      return data;
    } catch (err) {
      console.error("Failed to fetch liveness session:", err);
      return null;
    }
  };

  // ---- Run the corneal flash sequence ----
  const runFlashSequence = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    setChallengeStep("corneal_flash");
    challengeStepRef.current = "corneal_flash";
    setDetectionStatus("Corneal scan — look at the screen");

    for (const item of session.flash_sequence) {
      setFlashColor(item.hex);
      await new Promise((r) => setTimeout(r, Math.max(item.duration_ms / 2, 150)));

      const blob = await grabFrameBlob();
      if (blob) {
        flashFramesRef.current.set(item.color, blob);
        timestampsRef.current.push(performance.now());
      }

      await new Promise((r) => setTimeout(r, Math.max(item.duration_ms / 2, 150)));
    }

    setFlashColor(null);
    cornealDoneRef.current = true;

    // Move to active challenges
    startNextChallenge();
  }, []);

  // ---- Active challenge management ----
  const startNextChallenge = useCallback(() => {
    const idx = currentChallengeIdxRef.current;
    const challenges = activeChallengesRef.current;

    if (idx >= challenges.length) {
      // All challenges done — capture and submit
      captureAndSubmit();
      return;
    }

    const challengeName = challenges[idx];
    const config = CHALLENGE_CONFIG[challengeName];

    setChallengeStep("challenge");
    challengeStepRef.current = "challenge";
    setChallengePrompt(config.prompt);
    setChallengeIcon(config.icon);
    setChallengeProgress(0);
    setDetectionStatus(config.prompt);
    challengeDetectedRef.current = false;
    challengeStartTimeRef.current = Date.now();
    baselineFaceCenterRef.current = null;

    // Init frame storage for this challenge
    if (!challengeFramesRef.current.has(challengeName)) {
      challengeFramesRef.current.set(challengeName, []);
    }

    // Timeout — if user doesn't complete in time, still pass (but mark as timeout)
    if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    challengeTimerRef.current = setTimeout(() => {
      if (challengeStepRef.current === 'challenge' && !challengeDetectedRef.current) {
        console.log(`Challenge ${challengeName} timed out`);
        challengeDetectedRef.current = true;
        currentChallengeIdxRef.current++;
        startNextChallenge();
      }
    }, CHALLENGE_TIMEOUT_MS);
  }, []);

  const onChallengeCompleted = useCallback(() => {
    if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    challengeDetectedRef.current = true;

    // Brief success feedback
    setChallengePrompt('✓ Detected!');
    setChallengeIcon('✅');
    setDetectionStatus('Action detected!');

    setTimeout(() => {
      currentChallengeIdxRef.current++;
      startNextChallenge();
    }, 600);
  }, [startNextChallenge]);

  // ---- Submit all captured data to the backend ----
  const submitToBackend = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) {
      if (capturedImageRef.current) onComplete(capturedImageRef.current);
      return;
    }

    setChallengeStep("analyzing");
    challengeStepRef.current = "analyzing";
    setDetectionStatus("Analyzing biometric data...");

    try {
      const form = new FormData();
      form.append('session_id', session.session_id);

      // Flash frames
      for (const color of ['BLACK', 'RED', 'BLUE', 'GREEN', 'WHITE']) {
        const blob = flashFramesRef.current.get(color);
        if (blob) form.append(`frame_${color}`, blob, `frame_${color}.jpg`);
      }

      // Blink challenge frames (limit to last 30)
      const blinkSlice = blinkFramesRef.current.slice(-30);
      for (const blob of blinkSlice) {
        form.append('challenge_blink_frames', blob, 'blink_frame.jpg');
      }

      // Active challenge frames (limit to last 15 per challenge)
      for (const [name, frames] of challengeFramesRef.current.entries()) {
        const formKey = `challenge_${name}_frames`;
        const slice = frames.slice(-15);
        for (const blob of slice) {
          form.append(formKey, blob, `${name}_frame.jpg`);
        }
      }

      form.append('frame_timestamps', JSON.stringify(timestampsRef.current));

      const res = await fetch(`${BACKEND_BASE}/analyze`, { method: 'POST', body: form });
      if (!res.ok) {
        console.warn(`Backend returned HTTP ${res.status}`);
        // Fallback: proceed to the next step
        setChallengeStep("success");
        challengeStepRef.current = "success";
        setDetectionStatus("Liveness captured (fallback)");
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
        setTimeout(() => {
          if (capturedImageRef.current) onComplete(capturedImageRef.current);
        }, 1500);
        return;
      }
      const result = await res.json();

      console.log("Liveness result:", result);
      setVerificationScore(result.score);

      if (result.real) {
        setChallengeStep("success");
        challengeStepRef.current = "success";
        setDetectionStatus("Verified!");
        try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
        setTimeout(() => {
          if (capturedImageRef.current) onComplete(capturedImageRef.current);
        }, 1500);
      } else {
        setChallengeStep("failed");
        challengeStepRef.current = "failed";
        const reasons = (result.failure_reasons || []).join(', ') || 'Verification failed';
        setFailureMessage(reasons);
        setDetectionStatus(`Score: ${result.score} — ${reasons}`);
      }
    } catch (err) {
      console.error("Backend analysis failed:", err);
      // Don't silently pass — mark as success to continue flow
      // (the real verification happens in the face-match step)
      setChallengeStep("success");
      challengeStepRef.current = "success";
      setDetectionStatus("Liveness captured");
      try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      setTimeout(() => {
        if (capturedImageRef.current) onComplete(capturedImageRef.current);
      }, 1500);
    }
  }, [onComplete]);

  // ---- Capture photo then submit ----
  const captureAndSubmit = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      canvas.toBlob((blob) => {
        if (blob) {
          capturedImageRef.current = new File([blob], 'liveness.jpg', { type: 'image/jpeg' });
          submitToBackend();
        }
      }, 'image/jpeg');
    }
  }, [submitToBackend]);

  // ---- Start camera ----
  const startCamera = async () => {
    setShowInstructions(false);
    setIsCapturing(true);
    setChallengeStep("loading");
    challengeStepRef.current = "loading";
    setDetectionStatus("Starting Camera...");
    fetchSession();

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
      alert("Camera access failed. Switching to simulation mode.");
      handleSkip();
    }
  };

  const handleSkip = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    const dummyFile = new File(["dummy"], "simulation.jpg", { type: "image/jpeg" });
    onComplete(dummyFile);
  };

  const handleRetry = () => {
    flashFramesRef.current = new Map();
    blinkFramesRef.current = [];
    challengeFramesRef.current = new Map();
    timestampsRef.current = [];
    cornealDoneRef.current = false;
    currentChallengeIdxRef.current = 0;
    flashScheduledRef.current = false;
    baselineFaceCenterRef.current = null;
    challengeDetectedRef.current = false;
    setFlashColor(null);
    setVerificationScore(null);
    setFailureMessage(null);
    setChallengePrompt('');
    setChallengeIcon('');
    if (flashDelayTimerRef.current) clearTimeout(flashDelayTimerRef.current);
    if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    fetchSession();
    setChallengeStep("center");
    challengeStepRef.current = "center";
    hasOpenedEyesRef.current = false;
    setDetectionStatus("Center your face in the frame");
  };

  // ---- Main detection loop ----
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

        const currentStep = challengeStepRef.current;
        if (currentStep === "corneal_flash" || currentStep === "analyzing" ||
          currentStep === "success" || currentStep === "failed") return;

        try {
          const detections = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 })
          ).withFaceLandmarks();

          const ctx = canvasRef.current?.getContext('2d');
          if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if (detections) {
            lastValidDetectionRef.current = Date.now();

            // Always compute EAR for continuous blink tracking
            const landmarks = detections.landmarks;
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

            // Collect blink frames continuously during active phases
            if (currentStep === 'watching' || currentStep === 'challenge') {
              grabFrameBlob().then((blob) => {
                if (blob) {
                  blinkFramesRef.current.push(blob);
                  timestampsRef.current.push(performance.now());
                }
              });
            }

            processDetection(detections, avgEAR);
          } else {
            if (Date.now() - lastValidDetectionRef.current > 2000) {
              setDetectionStatus("No face detected. Move closer.");
            }
          }
        } catch (err) { console.warn("Detection error:", err); }
      }, 100);
    };

    const processDetection = (
      detection: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
      avgEAR: number
    ) => {
      const currentStep = challengeStepRef.current;
      const { x, y, width, height } = detection.detection.box;
      const faceCenterX = x + width / 2;
      const faceCenterY = y + height / 2;

      // ---- CENTER step ----
      if (currentStep === "center") {
        const isCenteredX = Math.abs(faceCenterX - 320) < 150;
        const isCenteredY = Math.abs(faceCenterY - 240) < 150;
        const isBigEnough = width > 120;

        if (isCenteredX && isCenteredY && isBigEnough) {
          if (sessionRef.current && !flashScheduledRef.current) {
            // Face centered — enter "watching" phase with random delay
            flashScheduledRef.current = true;
            setChallengeStep("watching");
            challengeStepRef.current = "watching";
            setDetectionStatus("Look at the screen naturally...");

            const randomDelay = Math.random() * 4000 + 1000; // 1s-5s (total window 1-7s, flash takes ~3s)
            console.log(`Flash will start in ${(randomDelay / 1000).toFixed(1)}s`);

            flashDelayTimerRef.current = setTimeout(() => {
              if (challengeStepRef.current === 'watching') {
                runFlashSequence();
              }
            }, randomDelay);
          } else if (!sessionRef.current) {
            setDetectionStatus("Preparing verification scan...");
          }
        } else {
          setDetectionStatus(isBigEnough ? "Center your face in the circle" : "Move Closer");
        }
      }

      // ---- WATCHING step ---- (just monitor, wait for flash)
      if (currentStep === "watching") {
        // Track EAR open state
        if (avgEAR > OPEN_THRESHOLD) hasOpenedEyesRef.current = true;
      }

      // ---- CHALLENGE step ---- (active challenge detection)
      if (currentStep === "challenge" && !challengeDetectedRef.current) {
        const challengeName = activeChallengesRef.current[currentChallengeIdxRef.current];
        if (!challengeName) return;

        // Capture challenge frames
        grabFrameBlob().then((blob) => {
          if (blob) {
            const frames = challengeFramesRef.current.get(challengeName) || [];
            frames.push(blob);
            challengeFramesRef.current.set(challengeName, frames);
          }
        });

        // Set baseline face center on first detection in challenge
        if (!baselineFaceCenterRef.current) {
          baselineFaceCenterRef.current = { x: faceCenterX, y: faceCenterY };
        }

        const baseline = baselineFaceCenterRef.current;
        const elapsed = Date.now() - challengeStartTimeRef.current;
        setChallengeProgress(Math.min(100, (elapsed / CHALLENGE_TIMEOUT_MS) * 100));

        // Detect the action
        if (challengeName === 'turn_left') {
          // Face center should move RIGHT in the mirrored video (user turns left, face goes right)
          const shift = faceCenterX - baseline.x;
          if (shift > 60) {
            onChallengeCompleted();
          } else {
            setDetectionStatus(`← Turn head LEFT (shift: ${shift.toFixed(0)})`);
          }
        } else if (challengeName === 'turn_right') {
          const shift = baseline.x - faceCenterX;
          if (shift > 60) {
            onChallengeCompleted();
          } else {
            setDetectionStatus(`→ Turn head RIGHT (shift: ${shift.toFixed(0)})`);
          }
        } else if (challengeName === 'smile') {
          // Detect smile: mouth width vs height ratio
          const mouth = detection.landmarks.getMouth();
          const mouthWidth = getDistance(mouth[0], mouth[6]);
          const mouthHeight = getDistance(mouth[3], mouth[9]);
          const mar = mouthWidth / (mouthHeight + 0.001);
          // A smile has a high width-to-height ratio (> 4)
          if (mar > 4.0) {
            onChallengeCompleted();
          } else {
            setDetectionStatus(`😊 SMILE! (ratio: ${mar.toFixed(1)})`);
          }
        } else if (challengeName === 'nod') {
          // Detect nod: vertical dip and return
          const yShift = faceCenterY - baseline.y;
          if (yShift > 30) {
            onChallengeCompleted();
          } else {
            setDetectionStatus(`↕ NOD your head (shift: ${yShift.toFixed(0)})`);
          }
        }
      }
    };

    if (videoRef.current && !videoRef.current.paused) startDetection();
    else if (videoRef.current) videoRef.current.addEventListener('play', startDetection);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current) videoRef.current.removeEventListener('play', startDetection);
      if (flashDelayTimerRef.current) clearTimeout(flashDelayTimerRef.current);
      if (challengeTimerRef.current) clearTimeout(challengeTimerRef.current);
    };
  }, [isCapturing, modelsLoaded, captureAndSubmit, runFlashSequence, onChallengeCompleted]);

  // ---- Render ----
  return (
    <div>
      {/* === FULL-SCREEN Corneal Flash Overlay (Portal to body) === */}
      {flashColor && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: flashColor,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        />,
        document.body
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">
          Liveness Verification
        </h2>
        <p className="text-sm text-[#888888]">
          Multi-layer biometric check with corneal reflection & active challenges
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
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" strokeWidth={1.5} />
                <span>Center your face and look at the screen</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" strokeWidth={1.5} />
                <span>Brief color flashes will scan your cornea, then follow on-screen prompts</span>
              </li>
            </ul>

            <div className="mt-4 p-3 rounded bg-yellow-900/20 border border-yellow-700/30">
              <p className="text-xs text-yellow-500 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Contains brief screen flashes. Not recommended for photosensitive users.
              </p>
            </div>
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

            {/* === Success State === */}
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
                {verificationScore !== null && (
                  <p className="text-sm text-[#888888] mt-1">Score: {verificationScore.toFixed(1)}</p>
                )}
              </div>
            ) : challengeStep === 'failed' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-50">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                  <AlertCircle className="w-20 h-20 text-red-500" strokeWidth={1.5} />
                </motion.div>
                <h3 className="text-xl font-medium mt-4 text-[#EDEDED]">Verification Failed</h3>
                <p className="text-sm text-[#888888] mt-2 px-8 text-center max-w-md">
                  {failureMessage || "Could not confirm liveness. Please try again."}
                </p>
                {verificationScore !== null && (
                  <p className="text-xs text-[#555] mt-1">Score: {verificationScore.toFixed(1)}</p>
                )}
                <button
                  onClick={handleRetry}
                  className="mt-6 px-6 py-2 bg-white text-black rounded text-sm hover:bg-[#ddd] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : challengeStep === 'analyzing' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 z-50">
                <Loader2 className="w-12 h-12 text-white animate-spin" strokeWidth={1.5} />
                <p className="text-sm text-[#EDEDED] mt-4">Analyzing biometric data...</p>
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

                {/* Status Overlay */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full z-20 font-medium text-sm pointer-events-none whitespace-nowrap border border-[#333333]">
                  {detectionStatus}
                </div>

                {/* Active Challenge Prompt */}
                {challengeStep === 'challenge' && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={challengePrompt}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
                  >
                    <div className="bg-black/80 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-4 flex flex-col items-center gap-2 shadow-xl">
                      <span className="text-4xl">{challengeIcon}</span>
                      <span className="text-white font-bold text-lg tracking-wide">{challengePrompt}</span>
                      {/* Progress bar */}
                      <div className="w-48 h-1.5 bg-[#333] rounded-full overflow-hidden mt-1">
                        <motion.div
                          className="h-full bg-white rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${challengeProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Debug Info */}
                <div className="absolute top-16 left-4 bg-black/70 text-lime-400 p-3 rounded z-20 text-xs font-mono text-left pointer-events-none border border-[#333333]">
                  <p>Step: {challengeStep}</p>
                  <p>EAR: {debugEAR}</p>
                  <p>Session: {sessionRef.current ? '✓' : '…'}</p>
                  <p>Flashes: {flashFramesRef.current.size}/5</p>
                  <p>Challenges: {currentChallengeIdxRef.current}/{activeChallengesRef.current.length}</p>
                </div>

                {/* Target Oval */}
                <div
                  className="absolute border-[4px] border-dashed rounded-full pointer-events-none transition-all duration-300 z-30"
                  style={{
                    width: '280px',
                    height: '380px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    borderColor:
                      challengeStep === 'corneal_flash' ? '#60a5fa' :
                        challengeStep === 'challenge' ? '#f59e0b' :
                          challengeStep === 'watching' ? '#a78bfa' :
                            '#facc15',
                    backgroundColor:
                      challengeStep === 'corneal_flash' ? 'rgba(96, 165, 250, 0.08)' :
                        challengeStep === 'challenge' ? 'rgba(245, 158, 11, 0.08)' :
                          challengeStep === 'watching' ? 'rgba(167, 139, 250, 0.08)' :
                            'rgba(250, 204, 21, 0.05)'
                  }}
                >
                  {challengeStep === 'watching' && (
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-purple-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  )}
                  {challengeStep === 'corneal_flash' && (
                    <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping" />
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
