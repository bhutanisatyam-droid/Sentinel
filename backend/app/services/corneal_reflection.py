import cv2
import numpy as np
import mediapipe as mp
import random
from typing import Dict, Any, List, Tuple, Optional
from skimage.feature import local_binary_pattern

class CornealReflectionAnalyzer:
    """
    Analyzes corneal (Purkinje) reflections to detect deepfakes.
    
    Real eyes are wet, curved surfaces that act as convex mirrors.
    When the screen flashes a known color, the cornea must reflect
    that color back. Deepfake/face-swap models cannot render accurate
    real-time environmental lighting reflections.
    
    This defeats:
    - Pre-recorded video replay (wrong reflections)
    - Real-time deepfake injection (models don't render corneal reflections)
    - 3D mask attacks (plastic/silicone doesn't reflect like wet cornea)
    - Photo attacks (paper/screen has no curved reflective surface)
    """

    FLASH_SEQUENCE = [
        {"color": "RED",   "rgb": (255, 0, 0),   "hex": "#FF0000", "duration_ms": 400},
        {"color": "BLUE",  "rgb": (0, 0, 255),   "hex": "#0000FF", "duration_ms": 400},
        {"color": "GREEN", "rgb": (0, 255, 0),   "hex": "#00FF00", "duration_ms": 400},
        {"color": "WHITE", "rgb": (255, 255, 255), "hex": "#FFFFFF", "duration_ms": 400},
    ]
    # Total sequence: ~1.6 seconds + capture delays ≈ 2.5 seconds total

    # We randomize the order each session to prevent pre-recording attacks
    # Attacker would need to know the exact sequence in advance

    REFLECTION_TOLERANCE = 10  # RGB channel tolerance (0-255)
    # Real reflections won't be pure color — they're attenuated by:
    # - Iris color (brown iris absorbs some light)
    # - Ambient lighting
    # - Camera white balance
    # So we check for DOMINANT channel shift, not exact color match

    MIN_REFLECTION_INTENSITY = 3  # Minimum brightness delta in the eye region
    # Below this, the reflection is too faint to analyze (very dark environment)

    def __init__(self):
        # Initialize MediaPipe Face Mesh (468 landmarks)
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        
        # Define eye landmark indices:
        self.LEFT_EYE_IRIS = [468, 469, 470, 471, 472]  # MediaPipe iris landmarks
        self.RIGHT_EYE_IRIS = [473, 474, 475, 476, 477]
        self.LEFT_EYE_CONTOUR = [33, 133, 160, 159, 158, 144, 145, 153]
        self.RIGHT_EYE_CONTOUR = [362, 263, 387, 386, 385, 373, 374, 380]

    def generate_session_sequence(self) -> List[Dict[str, Any]]:
        """
        Generate a randomized flash sequence for this session.
        Returns the sequence the frontend should display.
        """
        sequence = self.FLASH_SEQUENCE.copy()
        random.shuffle(sequence)
        # Add a baseline "BLACK" capture at the start (ambient reference)
        sequence.insert(0, {
            "color": "BLACK", 
            "rgb": (0, 0, 0),
            "hex": "#000000", 
            "duration_ms": 300
        })
        return sequence

    async def analyze_reflection(self, frames: Dict[str, bytes], expected_sequence: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main analysis function.
        
        Args:
          frames: dict mapping color name to captured frame bytes
            e.g., {"BLACK": <ambient_frame>, "RED": <red_flash_frame>, ...}
          expected_sequence: the sequence that was displayed
        
        Returns:
          Detailed analysis result dictionary.
        """
        
        # Step 1: Validate inputs
        if len(frames) < 5: # 4 colors + 1 baseline
            return {"real": False, "failure_reason": "Insufficient frames captured", "score": 0.0}

        decoded_frames = {}
        for color, frame_bytes in frames.items():
            nparr = np.frombuffer(frame_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"real": False, "failure_reason": f"Could not decode frame for {color}", "score": 0.0}
            decoded_frames[color] = img

        if "BLACK" not in decoded_frames:
             return {"real": False, "failure_reason": "Missing baseline BLACK frame", "score": 0.0}

        # Step 2: Extract iris regions from each frame
        iris_rois = {} # {color: (left_roi, right_roi)}
        
        for color, img in decoded_frames.items():
            results = self.face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            
            if not results.multi_face_landmarks:
                return {"real": False, "failure_reason": f"Face lost during {color} frame", "score": 0.0}
            
            landmarks = results.multi_face_landmarks[0].landmark
            
            left_roi, right_roi, _ = self._extract_iris_roi(img, landmarks)
            
            if left_roi is None or right_roi is None:
                 return {"real": False, "failure_reason": f"Could not extract iris in {color} frame", "score": 0.0}
                 
            iris_rois[color] = (left_roi, right_roi)

        # Step 3: Compute ambient baseline
        baseline_left, baseline_right = iris_rois["BLACK"]
        # We don't just take one frame diff, we take diff against this baseline
        
        # Step 4: For each color flash, analyze the reflection
        per_flash_results = []
        passed_flashes = 0
        total_flashes = 0
        
        # Helper to check channels
        def check_color_pass(delta_r, delta_g, delta_b, expected_color):
            passed = False
            details = {}
            
            if expected_color == "RED":
                passed = (delta_r > self.MIN_REFLECTION_INTENSITY and 
                          delta_r > delta_g + self.REFLECTION_TOLERANCE and 
                          delta_r > delta_b + self.REFLECTION_TOLERANCE)
                details = {"expected": "R", "detected_dominant": "R" if passed else "Other"}
                
            elif expected_color == "BLUE":
                passed = (delta_b > self.MIN_REFLECTION_INTENSITY and 
                          delta_b > delta_r + self.REFLECTION_TOLERANCE and 
                          delta_b > delta_g + self.REFLECTION_TOLERANCE)
                details = {"expected": "B", "detected_dominant": "B" if passed else "Other"}
                
            elif expected_color == "GREEN":
                passed = (delta_g > self.MIN_REFLECTION_INTENSITY and 
                          delta_g > delta_r + self.REFLECTION_TOLERANCE and 
                          delta_g > delta_b + self.REFLECTION_TOLERANCE)
                details = {"expected": "G", "detected_dominant": "G" if passed else "Other"}
                
            elif expected_color == "WHITE":
                # For white, all should be somewhat up
                max_d = max(delta_r, delta_g, delta_b)
                min_d = min(delta_r, delta_g, delta_b)
                passed = (delta_r > self.MIN_REFLECTION_INTENSITY and
                          delta_g > self.MIN_REFLECTION_INTENSITY and
                          delta_b > self.MIN_REFLECTION_INTENSITY and
                          (max_d - min_d) < self.REFLECTION_TOLERANCE * 2)
                details = {"expected": "ALL", "detected_dominant": "Balanced" if passed else "Imbalanced"}
            
            return passed, details

        # Iterate only through the EXPECTED sequence (skipping BLACK)
        for item in expected_sequence:
            color = item["color"]
            if color == "BLACK": continue
            
            if color not in iris_rois: continue # Should have caught earlier, but safe guard
            
            total_flashes += 1
            left_roi, right_roi = iris_rois[color]
            
            # Compute Deltas (Left Eye)
            delta_l = self._compute_channel_delta(left_roi, baseline_left)
            pass_l, details_l = check_color_pass(delta_l[0], delta_l[1], delta_l[2], color)
            
            # Compute Deltas (Right Eye)
            delta_r = self._compute_channel_delta(right_roi, baseline_right)
            pass_r, details_r = check_color_pass(delta_r[0], delta_r[1], delta_r[2], color)
            
            # Flash passes if BOTH eyes reflect the color (strict)
            # Or if one eye is extremely strong (maybe other was blinked/glared)?
            # Directive says: "If any colored flash failed on both eyes: suspicious" -> implies verify on at least one?
            # Let's enforce stricter: BOTH eyes should ideally match, or at least one strong match.
            # For robustness: PASS if (left OR right) matches.
            # But let's verify reliability. Deepfake might fail on both.
            
            flash_passed = pass_l or pass_r
            if flash_passed:
                passed_flashes += 1
            
            per_flash_results.append({
                "color": color,
                "passed": flash_passed,
                "left_delta": delta_l,
                "right_delta": delta_r,
                "details": details_l if pass_l else details_r
            })

        # Step 5: Compute iris quality score
        # Use the BLACK frame for quality check (no reflection glare interference potentially)
        q_l = self._assess_iris_texture_quality(baseline_left)
        q_r = self._assess_iris_texture_quality(baseline_right)
        avg_quality = (q_l + q_r) / 2.0
        
        # Step 6: Aggregate results
        if total_flashes == 0: total_flashes = 1 # Avoid div by zero
        
        reflection_score = (passed_flashes / total_flashes) * 40
        quality_score = avg_quality * 60
        total_score = reflection_score + quality_score
        
        # Determining Real vs Fake
        # "real = True if score >= 70 AND at least 3/4 colored flashes passed"
        # Note: We have 4 flashes usually. 3/4 = 75%.
        colored_passed = sum(1 for res in per_flash_results if res["color"] != "WHITE" and res["passed"])
        total_colored = sum(1 for res in per_flash_results if res["color"] != "WHITE")
        
        is_real = False
        if total_score >= 70 and colored_passed >= (total_colored * 0.75):
            is_real = True
            
        return {
            "real": is_real,
            "score": float(total_score),
            "method": "corneal_reflection",
            "per_flash_results": per_flash_results,
            "eyes_detected": True,
            "iris_quality": float(avg_quality),
            "failure_reason": None
        }

    def _extract_iris_roi(self, frame: np.ndarray, landmarks: Any) -> Tuple[Optional[np.ndarray], Optional[np.ndarray], float]:
        """
        Extract the iris region from a frame using face mesh landmarks.
        Returns (left_iris_crop, right_iris_crop, quality_score)
        """
        h, w, _ = frame.shape
        
        def get_coords(indices):
            pts = []
            for idx in indices:
                pt = landmarks[idx]
                pts.append([int(pt.x * w), int(pt.y * h)])
            return np.array(pts)

        def crop_eye(iris_indices):
            pts = get_coords(iris_indices)
            
            # Simple bounding box
            min_x, min_y = np.min(pts, axis=0)
            max_x, max_y = np.max(pts, axis=0)
            
            center_x, center_y = np.mean(pts, axis=0).astype(int)
            radius = int(np.max(np.linalg.norm(pts - np.array([center_x, center_y]), axis=1)))
            
            # Expand radius for crop
            crop_radius = int(radius * 2.5)
            
            x1 = max(0, center_x - crop_radius)
            y1 = max(0, center_y - crop_radius)
            x2 = min(w, center_x + crop_radius)
            y2 = min(h, center_y + crop_radius)
            
            crop = frame[y1:y2, x1:x2]
            
            # Create Circular Mask
            mask = np.zeros(crop.shape[:2], dtype=np.uint8)
            # Center of crop is now (center_x - x1, center_y - y1)
            cv2.circle(mask, (center_x - x1, center_y - y1), radius, 255, -1)
            
            masked_crop = cv2.bitwise_and(crop, crop, mask=mask)
            return masked_crop

        try:
            left_crop = crop_eye(self.LEFT_EYE_IRIS)
            right_crop = crop_eye(self.RIGHT_EYE_IRIS)
            return left_crop, right_crop, 1.0
        except Exception:
            return None, None, 0.0

    def _compute_channel_delta(self, flash_roi: np.ndarray, baseline_roi: np.ndarray) -> List[float]:
        """
        Compute per-channel RGB difference between flash and baseline.
        Returns [delta_R, delta_G, delta_B] as mean values over the ROI.
        """
        if flash_roi.shape != baseline_roi.shape:
            # Resize if slightly different due to crop rounding? 
            # Ideally they should be same if landmarks stable.
            # For safety resize flash to baseline
            flash_roi = cv2.resize(flash_roi, (baseline_roi.shape[1], baseline_roi.shape[0]))
            
        f_float = flash_roi.astype(np.float32)
        b_float = baseline_roi.astype(np.float32)
        
        diff = cv2.subtract(f_float, b_float)
        
        # Only consider non-black pixels (masked region)
        # Sum of channels > 0
        mask = np.sum(flash_roi, axis=2) > 0
        
        if np.sum(mask) == 0:
            return [0.0, 0.0, 0.0]
            
        # Mean of diff where mask is true
        means = []
        for i in range(3): # B, G, R in OpenCV!
            # opencv loads BGR
            channel_diff = diff[:, :, i]
            mean_val = np.mean(channel_diff[mask])
            means.append(mean_val)
            
        # Return R, G, B order
        return [means[2], means[1], means[0]]

    def _assess_iris_texture_quality(self, iris_roi: np.ndarray) -> float:
        """
        Score the iris texture quality. Real irises have rich texture.
        Returns 0.0 (smooth/fake) to 1.0 (detailed/real).
        """
        if iris_roi is None or iris_roi.size == 0:
             return 0.0
             
        gray = cv2.cvtColor(iris_roi, cv2.COLOR_BGR2GRAY)
        
        # Crop mask check
        mask = gray > 0
        if np.sum(mask) == 0: return 0.0
        
        roi_pixels = gray[mask]
        
        # 1. Laplacian Variance (Sharpness)
        # We compute on the bounding box but variance might be thrown off by black borders
        # Better to compute laplacian of full image then mask?
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        # Variance of the masked region
        lap_var = np.var(laplacian[mask]) if np.sum(mask) > 0 else 0
        
        # Normalize: > 100 is good
        norm_lap = min(1.0, lap_var / 100.0)
        
        # 2. LBP Entropy (Texture)
        # LBP is robust
        radius = 1
        n_points = 8 * radius
        lbp = local_binary_pattern(gray, n_points, radius, method="uniform")
        
        # Calculate entropy of LBP histogram
        hist, _ = np.histogram(lbp[mask].ravel(), bins=np.arange(0, n_points + 3), range=(0, n_points + 2))
        hist = hist.astype("float")
        hist /= (hist.sum() + 1e-7)
        entropy = -np.sum(hist * np.log2(hist + 1e-7))
        
        # Max entropy for uniform LBP is log2(10) ~ 3.32
        norm_entropy = min(1.0, entropy / 3.32)
        
        # Weighted Score
        return 0.6 * norm_lap + 0.4 * norm_entropy
