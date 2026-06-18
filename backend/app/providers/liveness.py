from app.providers.base import LivenessProvider
import cv2
import numpy as np

class BasicLivenessProvider(LivenessProvider):
    async def check_liveness(self, frames: list[bytes]) -> dict:
        if not frames:
            return {"real": False, "score": 0.0, "method": "cv2_haar", "error": "No frames provided"}
            
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            face_found = False
            for frame_bytes in frames:
                arr = np.frombuffer(frame_bytes, np.uint8)
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
                if img is None: continue
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                if len(faces) > 0:
                    face_found = True
                    break
                    
            if face_found:
                return {"real": True, "score": 90.0, "method": "cv2_haar"}
            else:
                return {"real": False, "score": 20.0, "method": "cv2_haar"}
                
        except Exception as e:
            return {"real": False, "score": 0.0, "method": "cv2_haar", "error": str(e)}
