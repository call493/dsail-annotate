from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import tempfile
import os
import threading
from concurrent.futures import ThreadPoolExecutor
import uuid

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
print("Loading YOLO models...")
for model_id, model_info in MODELS.items():
    if os.path.exists(model_info["path"]):
        try:
            loaded_models[model_id] = YOLO(model_info["path"])
            print(f"✓ Loaded model: {model_info['name']}")
        except Exception as e:
            print(f"✗ Failed to load {model_info['name']}: {str(e)}")
    else:
        print(f"✗ Model file not found: {model_info['path']}")

print(f"Successfully loaded {len(loaded_models)} out of {len(MODELS)} models")

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

    if not loaded_models:
        return jsonify({"error": "No models available"}), 500

    # Get selected model (default to first available)
    model_id = request.form.get("model", list(loaded_models.keys())[0])
    
    if not model_id or model_id not in loaded_models:
        return jsonify({"error": "Invalid or unavailable model"}), 400

    image_file = request.files["image"]
    selected_model = loaded_models[model_id]
    
    try:
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
    
    except Exception as e:
        if 'temp' in locals():
            try:
                os.remove(temp.name)
            except:
                pass
        return jsonify({"error": f"Detection failed: {str(e)}"}), 500

def process_single_image(image_file, model_id, image_name):
    """Process a single image and return annotations"""
    if model_id not in loaded_models:
        return {
            "image_name": image_name,
            "error": "Invalid or unavailable model",
            "annotations": []
        }
    
    selected_model = loaded_models[model_id]
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp:
            image_file.save(temp.name)
            results = selected_model(temp.name)
            annotations = []
            
            if results[0].boxes is not None:
                for i, box in enumerate(results[0].boxes):
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    label = results[0].names[int(box.cls[0])]
                    confidence = float(box.conf[0])
                    annotations.append({
                        "id": f"ai-{uuid.uuid4().hex[:8]}",
                        "label": label,
                        "confidence": confidence,
                        "bbox": {
                            "x": int(x1),
                            "y": int(y1),
                            "width": int(x2-x1),
                            "height": int(y2-y1)
                        },
                        "source": "ai",
                        "visible": True
                    })
        
        os.remove(temp.name)
        return {
            "image_name": image_name,
            "annotations": annotations,
            "error": None
        }
    
    except Exception as e:
        if 'temp' in locals():
            try:
                os.remove(temp.name)
            except:
                pass
        return {
            "image_name": image_name,
            "error": f"Detection failed: {str(e)}",
            "annotations": []
        }

@app.route("/api/detect-batch", methods=["POST"])
def detect_batch():
    """Process multiple images in parallel"""
    if not request.files:
        return jsonify({"error": "No images uploaded"}), 400

    if not loaded_models:
        return jsonify({"error": "No models available"}), 500

    # Get selected model (default to first available)
    model_id = request.form.get("model", list(loaded_models.keys())[0])
    
    if not model_id or model_id not in loaded_models:
        return jsonify({"error": "Invalid or unavailable model"}), 400

    # Get all uploaded images
    images = []
    for key in request.files:
        if key.startswith('image_'):
            file = request.files[key]
            if file.filename:
                images.append((file, file.filename))

    if not images:
        return jsonify({"error": "No valid images found"}), 400

    # Process images in parallel
    max_workers = min(len(images), 4)  # Limit to 4 concurrent processes
    results = []
    
    try:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_image = {
                executor.submit(process_single_image, img_file, model_id, img_name): img_name 
                for img_file, img_name in images
            }
            
            # Collect results
            for future in future_to_image:
                result = future.result()
                results.append(result)
        
        return jsonify({
            "results": results,
            "model_used": MODELS[model_id]["name"],
            "total_processed": len(results)
        })
    
    except Exception as e:
        return jsonify({"error": f"Batch processing failed: {str(e)}"}), 500

if __name__ == "__main__":
    if not loaded_models:
        print("WARNING: No models were loaded successfully!")
        print("Please check that your .pt model files exist in the backend folder")
    else:
        print(f"Starting Flask server with {len(loaded_models)} models...")
    app.run(host="0.0.0.0", port=5000, debug=True)