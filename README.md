# DSAIL Annotate

## Setup Instructions

### 1. Backend (YOLO Model Inference)

#### Prerequisites
- Python 3.8+
- Your YOLO model file ([MDV6-yolov9-c.pt](https://zenodo.org/records/15398270/files/MDV6-yolov9-c.pt)) in the `backend` directory

#### Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Run the backend server
```bash
python app.py
```
The backend will start at `http://0.0.0.0:5000`.

---

### 2. Frontend (React App)

#### Prerequisites
- Node.js and npm

#### Install dependencies
```bash
npm install
```

#### Start the React app
```bash
npm start
```
The frontend will start at `http://localhost:3000`.

---

### 3. Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Upload an image.
3. Click "Run Model" to perform object detection using your local YOLO model.
4. View and export annotations.

---

### Troubleshooting

- **CORS errors:** Ensure `flask-cors` is installed and `CORS(app)` is present in `app.py`.
- **Connection errors:** Make sure both backend and frontend servers are running.
- **Model errors:** Confirm your model file is named `MDV6-yolov9-c.pt` and is in the `backend` directory.

---