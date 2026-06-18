import cv2
import numpy as np
from deepface import DeepFace
from app.providers.base import FaceMatchProvider
import logging

logger = logging.getLogger(__name__)

class DeepFaceMatchProvider(FaceMatchProvider):
    async def compare_faces(self, face1_bytes: bytes, face2_bytes: bytes) -> dict:
        try:
            arr_a = np.frombuffer(face1_bytes, np.uint8)
            arr_b = np.frombuffer(face2_bytes, np.uint8)
            img_a = cv2.imdecode(arr_a, cv2.IMREAD_COLOR)
            img_b = cv2.imdecode(arr_b, cv2.IMREAD_COLOR)
            
            if img_a is None or img_b is None:
                return {"score": 0.0, "match": False, "error": "Could not decode image", "threshold": 75.0}
            
            res = DeepFace.verify(
                img1_path=img_a,
                img2_path=img_b,
                model_name="ArcFace",
                detector_backend="opencv",
                enforce_detection=False
            )
            distance = res.get("distance", 1.0)
            similarity = max(0.0, 1.0 - distance)
            score = round(similarity * 100, 1)
            return {"score": score, "match": score >= 75.0, "threshold": 75.0}
        except Exception as e:
            logger.error(f"DeepFace comparison failed: {e}")
            return {"score": 0.0, "match": False, "error": str(e), "threshold": 75.0}
