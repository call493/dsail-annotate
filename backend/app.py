from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import tempfile
import os

app = Flask(__name__)
CORS(app) 

# Load all available models
MODELS = {
    "mdv6-yolov9": {
        "path": os.path.join(os.path.dirname(__file__), "MDV6-yolov9-c.pt"),
        "name": "MDV6 YOLOv9-C",
        "description": "General object detection model"
    },
    "mugie-grevys-plains": {
        "path": os.path.join(os.path.dirname(__file__), "mugie-grevys-plains-other-model-version-6.pt"),
        "name": "Mugie Grevy's & Plains",
        "description": "Specialized for Grevy's zebras and plains animals"
    },
    "mugie-zebra": {
        "path": os.path.join(os.path.dirname(__file__), "mugie-zebra-other-model-version-6.pt"),
        "name": "Mugie Zebra",
        "description": "Specialized for zebra detection"
    }
}

# Load models into memory
loaded_models = {}
for model_id, model_info in MODELS.items():
    if os.path.exists(model_info["path"]):
        loaded_models[model_id] = YOLO(model_info["path"])
        print(f"Loaded model: {model_info['name']}")
    else:
        print(f"Model file not found: {model_info['path']}")

@app.route("/api/models", methods=["GET"])
def get_models():
    available_models = []
    for model_id, model_info in MODELS.items():
        if model_id in loaded_models:
            available_models.append({
                "id": model_id,
                "name": model_info["name"],
                "description": model_info["description"]
            })
    return jsonify({"models": available_models})

@app.route("/api/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    # Get selected model (default to first available)
    model_id = request.form.get("model", list(loaded_models.keys())[0] if loaded_models else None)
    
    if not model_id or model_id not in loaded_models:
        return jsonify({"error": "Invalid or unavailable model"}), 400

    image_file = request.files["image"]
    selected_model = loaded_models[model_id]
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
        image_file.save(temp.name)
        results = selected_model(temp.name)
        annotations = []
        
        if results[0].boxes is not None:
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
    return jsonify({
        "annotations": annotations,
        "model_used": MODELS[model_id]["name"]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)