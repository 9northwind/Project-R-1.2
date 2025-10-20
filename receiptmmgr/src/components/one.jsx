import { useState, useRef } from 'react';
import { db, serverTimestamp, collection, addDoc } from "../firebase.js";

import Top from './top.jsx';
import Bottom from './bottom.jsx';
import "../styles/one.css";

export default function One({ onExtracted }) {
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [message, setMessage] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImageURL(URL.createObjectURL(file));
      setExtractedData(null);
    }
  };

  const handleUploadClick = () => {
    document.getElementById("fileInput").click();
  };

const handleExtractClick = async () => {
  if (!imageFile) {
    setMessage("Please upload an image first!");
    return;
  }

  setMessage("Extracting data... please wait.");

  const formData = new FormData();
  formData.append("file", imageFile);

  try {
    const response = await fetch("http://127.0.0.1:8000/extract-receipt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      console.log("Extracted Data:", data.data);
      setExtractedData(data.data);
      setMessage("Extraction complete!. You can save the file now");
      onExtracted?.(data.data);
    } else {
      setMessage("Extraction failed: " + data.message);
    }
  } catch (error) {
    console.error("Error extracting data:", error);
    setMessage("Failed to extract data due to a network error.");
  }
};


  const handleSaveClick = async () => {
    if (!extractedData) {
      alert("No extracted data to save!");
      return;
    }

    try {
      const receiptRef = await addDoc(collection(db, "receipts"), {
        type_of_purchase: extractedData.type_of_purchase,
        date: extractedData.date,
        establishment_name: extractedData.establishment_name,
        total: extractedData.total,
        created_at: serverTimestamp()
      });

      for (const item of extractedData.items || []) {
        await addDoc(collection(db, "receipts", receiptRef.id, "items"), {
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        });
      }

      alert("Receipt saved successfully!");
    } catch (err) {
      console.error("Error saving receipt:", err);
      alert("Failed to save receipt.");
    }
  };

  const handleCameraClick = async () => {
    setExtractedData(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      timeoutRef.current = setTimeout(() => {
        stopCamera();
      }, 20000);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraOpen(false);
    }
  };

  const handleCaptureClick = async () => {
    if (!videoRef.current || !canvasRef.current) {
      alert("Camera not ready!");
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Failed to capture image from camera.");
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "camera_capture.jpg");

      try {
        const response = await fetch("http://127.0.0.1:8000/extract-receipt", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.status === "success") {
          console.log("Extracted Data (Camera):", data.data);
          setExtractedData(data.data);
          onExtracted?.(data.data);
        } else {
          alert("Extraction failed: " + data.message);
        }
      } catch (error) {
        console.error("Error extracting data from camera:", error);
        alert("Failed to extract data from camera.");
      }
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  return (

    <div className='one-container'>

      <Top />

      <div className="one">
        <div className="files">
          <small>Upload or Scan Receipt</small>

          <input
            type="file"
            accept="image/*"
            id="fileInput"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className='buttons'>
            <button className="camera" onClick={handleCameraClick}>
              <span className="material-symbols-outlined">camera</span>
            </button>

            <button className="capture" onClick={handleCaptureClick}>
              <span className="material-symbols-outlined">photo_camera</span>
            </button>

            <button className="stop" onClick={stopCamera}>
              <span className="material-symbols-outlined">stop</span>
            </button>

            <button className="upload" onClick={handleUploadClick}>
              <span className="material-symbols-outlined">upload</span>
            </button>

            <button className="extract" onClick={handleExtractClick}>
              <span className="material-symbols-outlined">chip_extraction</span>
            </button>

            <button className="save" onClick={handleSaveClick}>
              <span className="material-symbols-outlined">save</span>
            </button>
          </div>

          <div className="receipt">
            {cameraOpen ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: "100%", border: "1px solid transparent" }}
              />
            ) : imageURL ? (
              <img
                src={imageURL}
                alt="Uploaded Receipt"
                className="receipt-image"
              />
            ) : (
              <p>No image uploaded yet</p>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <div className="status-message">
            {message && <p>{message}</p>}
          </div>

        </div>


        {/* <div className="preview">
          <div className='preview-result'>
            {extractedData && (
              <div className="extracted-output">
                <h3>Extracted Data</h3>
                <pre>{JSON.stringify(extractedData, null, 2)}</pre>
              </div>
            )}
          </div>
        </div> */}

      </div>

      <Bottom />

    </div>
  );
}