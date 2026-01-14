import sys
import json
import cv2
import numpy as np
import os

def simple_opencv_match(img1_path, img2_path):
    """
    Fallback method using basic OpenCV Histogram comparison.
    Not true 'face recognition' but simpler to run without dlib.
    """
    img1 = cv2.imread(img1_path)
    img2 = cv2.imread(img2_path)
    
    if img1 is None or img2 is None:
        return 0

    # Convert to HSV
    hsv_base = cv2.cvtColor(img1, cv2.COLOR_BGR2HSV)
    hsv_test = cv2.cvtColor(img2, cv2.COLOR_BGR2HSV)

    # Calculate histograms
    hist_base = cv2.calcHist([hsv_base], [0, 1], None, [50, 60], [0, 180, 0, 256])
    hist_test = cv2.calcHist([hsv_test], [0, 1], None, [50, 60], [0, 180, 0, 256])

    # Normalize
    cv2.normalize(hist_base, hist_base, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist_test, hist_test, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

    # Compare (Correlation)
    score = cv2.compareHist(hist_base, hist_test, cv2.HISTCMP_CORREL)
    
    # Map -1 to 1 correlation to 0-100 score
    # Usually 0.5+ is good match for histograms of same object
    return max(0, min(100, score * 100))

def match_faces(img1_path, img2_path):
    try:
        import face_recognition
        
        # Load images
        image1 = face_recognition.load_image_file(img1_path)
        image2 = face_recognition.load_image_file(img2_path)

        # Get encodings
        encodings1 = face_recognition.face_encodings(image1)
        encodings2 = face_recognition.face_encodings(image2)

        if len(encodings1) == 0 or len(encodings2) == 0:
            return {"error": "No face detected in one or both images"}

        # Compare faces
        # results is list of True/False
        results = face_recognition.compare_faces([encodings1[0]], encodings2[0])
        distance = face_recognition.face_distance([encodings1[0]], encodings2[0])[0]
        
        # Convert distance to score (lower distance is better)
        # 0.6 is typical threshold
        # Create a score: (1 - distance) * 100 roughly
        score = max(0, (1 - distance) * 100)

        return {
            "match": bool(results[0]),
            "score": score,
            "method": "deep_learning"
        }

    except ImportError:
        # Fallback to OpenCV
        score = simple_opencv_match(img1_path, img2_path)
        return {
            "match": score > 50,
            "score": score,
            "method": "opencv_histogram_fallback",
            "warning": "face_recognition library not found"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing image paths"}))
        sys.exit(1)

    img1 = sys.argv[1]
    img2 = sys.argv[2]
    
    result = match_faces(img1, img2)
    print(json.dumps(result))
