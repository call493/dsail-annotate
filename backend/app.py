from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import tempfile
import os

app = Flask(__name__)
CORS(app) 

MODEL_PATH = os.path.join(os.path.dirname(__file__), "MDV6-yolov9-c.pt")
model = YOLO(MODEL_PATH)

@app.route("/api/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image_file = request.files["image"]
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        image_file.save(temp.name)
        results = model(temp.name)
        annotations = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            label = results[0].names[int(box.cls[0])]
            confidence = float(box.conf[0])
            annotations.append({
                "id": f"ai-{len(annotations)+1}",
                "label": label,
                "confidence": confidence,
                "bbox": {
                    "x": int(x1),
                    "y": int(y1),
                    "width": int(x2-x1),
                    "height": int(y2-y1)
                },
                "source": "ai",
                "verified": False
            })
    os.remove(temp.name)
    return jsonify({"annotations": annotations})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)