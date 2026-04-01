from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import base64
import os
from image_analyze import analyze_image

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return "Server is running"

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.json
        if not data or "image" not in data:
            return jsonify({"error": "No image provided"}), 400

        image_b64 = data.get("image")
        image_ext = ".jpg"
        if isinstance(image_b64, str) and image_b64.startswith("data:"):
            header = image_b64.split(",", 1)[0].lower()
            if "image/png" in header:
                image_ext = ".png"
            elif "image/jpeg" in header or "image/jpg" in header:
                image_ext = ".jpg"
            elif "image/webp" in header:
                image_ext = ".webp"
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        image_bytes = base64.b64decode(image_b64)

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=image_ext)
        temp_file.write(image_bytes)
        temp_file.close()

        result = analyze_image(temp_file.name)

        os.remove(temp_file.name)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")