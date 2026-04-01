import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function Improve({ history, addToHistory, clearHistory }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [themeIcon, setThemeIcon] = useState(null);

  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Upload from gallery
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    setShowUploadOptions(false);
  };

  // ✅ Open Camera (HD quality)
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 }
        }
      });

      setCameraStream(stream);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

      setShowUploadOptions(false);
    } catch (err) {
      alert("Camera access denied or not supported");
    }
  };

  // ✅ Capture photo (AI optimized)
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const size = 640;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    // center crop for face focus
    const minSide = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minSide) / 2;
    const sy = (video.videoHeight - minSide) / 2;

    ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, size, size);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(imageData);

    // stop camera
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
  };

  // ✅ Detect emotion
  const handleDetect = async () => {
    if (!preview) {
      alert("Upload or capture image first");
      return;
    }

    setLoading(true);

    try {
      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview })
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response");
      }

      data.forEach(face => {
        addToHistory({
          image: preview,
          emoji: face.emoji,
          label: face.emotion,
          confidence: face.confidence
        });
      });

      setOverlay({ image: preview, faces: data });

    } catch (err) {
      alert("Detection failed. Try again.");
    }

    setLoading(false);
  };

  // ✅ Download result
  const handleDownload = () => {
    const imageSrc = overlay?.image || preview;
    if (!imageSrc) return;

    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = "emotion-result.jpg";
    link.click();
  };

  // ✅ Chart data
  const chartData = {
    labels: history.map(h => h.label),
    datasets: [{
      data: history.map(h => h.confidence),
      backgroundColor: [
        "#f6c", "#6cf", "#fc6", "#6f6",
        "#f66", "#ccc", "#999"
      ]
    }]
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={darkMode ? "dark app-container" : "light app-container"}
    >
      <h1 className="title">Emotion Detector</h1>

      {/* Preview */}
      <div className="preview-box">
        {preview ? (
          <img src={preview} alt="preview" />
        ) : (
          <p className="upload-text">Upload image</p>
        )}
      </div>

      {/* Buttons */}
      <div className="options">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          hidden
        />

        <button onClick={() => setShowUploadOptions(true)}>Upload</button>
        <button onClick={handleDetect}>
          {loading ? "Processing..." : "Detect"}
        </button>
        <button onClick={() => setShowHistory(!showHistory)}>History</button>
        <button onClick={handleDownload}>Download</button>

        <button onClick={() => {
          setDarkMode(!darkMode);
          setThemeIcon(!darkMode ? "🌙" : "☀️");
          setTimeout(() => setThemeIcon(null), 1000);
        }}>
          {darkMode ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      {/* Upload Options */}
      <AnimatePresence>
        {showUploadOptions && (
          <motion.div className="upload-modal">
            <div className="upload-box">
              <h3>Select Source</h3>

              <button onClick={openCamera}>📷 Camera</button>
              <button onClick={() => fileInputRef.current.click()}>
                🖼️ Gallery
              </button>

              <button
                className="overlay-close"
                onClick={() => setShowUploadOptions(false)}
              >
                ✖
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Overlay */}
      <AnimatePresence>
        {cameraStream && (
          <motion.div className="fullscreen-overlay">
            <div className="overlay-content">

              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", borderRadius: "12px" }}
              />

              <button onClick={capturePhoto} style={{ marginTop: "1rem" }}>
                📸 Capture
              </button>

              <button
                className="overlay-close"
                onClick={() => {
                  cameraStream.getTracks().forEach(track => track.stop());
                  setCameraStream(null);
                }}
              >
                ✖
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Overlay */}
      <AnimatePresence>
        {overlay && (
          <motion.div className="fullscreen-overlay">
            <div className="overlay-content">

              <img src={overlay.image} alt="" />

              {overlay.faces.map((f, i) => (
                <motion.div key={i} className="overlay-label">
                  {f.emoji} {f.emotion} ({Math.round(f.confidence)}%)
                </motion.div>
              ))}

              <button
                className="overlay-close"
                onClick={() => setOverlay(null)}
              >
                ✖
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div className="history-sidebar">

            <div className="sidebar-header">
              <h2>History</h2>
              <button
                className="overlay-close"
                onClick={() => setShowHistory(false)}
              >
                ✖
              </button>
            </div>

            {history.map((item, i) => (
              <div key={i} className="history-item">
                <img src={item.image} alt="" />
                <span>
                  {item.emoji} {item.label} ({Math.round(item.confidence)}%)
                </span>
              </div>
            ))}

            {history.length > 0 && <Pie data={chartData} />}

            <button className="clear-btn" onClick={clearHistory}>
              Clear History
            </button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Icon */}
      <AnimatePresence>
        {themeIcon && (
          <motion.div className="theme-icon">
            {themeIcon}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Improve;






