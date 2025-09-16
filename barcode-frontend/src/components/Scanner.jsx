"use client";

import { useEffect, useState, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { Loader2, Camera, CameraOff, Upload } from "lucide-react";

export default function Scanner() {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImg, setUploadedImg] = useState(null);

  const videoRef = useRef(null);
  const imageRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  // Start live camera scan
  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result, err) => {
          if (result) {
            handleBarcodeResult(result.getText());
          }
          if (err && !(err.name === "NotFoundException")) {
            console.warn("Scanner error:", err);
          }
        }
      );
    } catch (err) {
      setError("❌ Could not access camera.");
    }
  };

  const stopCamera = () => {
    codeReader.current.reset();
    setIsScanning(false);
  };

  // Handle API call when barcode detected
  const handleBarcodeResult = async (decodedText) => {
    setScanResult(decodedText);
    try {
      setIsLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/scan/${decodedText}`);
      const data = await res.json();
      setProduct(data);
      setError(null);
    } catch (apiErr) {
      setError("❌ Could not fetch product details.");
    } finally {
      setIsLoading(false);
      stopCamera();
    }
  };

  // Handle image upload scanning
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setProduct(null);
    setUploadedImg(URL.createObjectURL(file));
  };

  // Decode once image loads
  useEffect(() => {
    if (uploadedImg && imageRef.current) {
      const decodeImage = async () => {
        try {
          setIsLoading(true);
          const result = await codeReader.current.decodeFromImage(imageRef.current);
          if (result) {
            handleBarcodeResult(result.getText());
          } else {
            setError("❌ Could not detect a barcode in the image.");
          }
        } catch (err) {
          console.error(err);
          setError("❌ Failed to decode barcode from image.");
        } finally {
          setIsLoading(false);
        }
      };
      decodeImage();
    }
  }, [uploadedImg]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-indigo-700 mb-6 text-center">
        📦 Barcode Scanner
      </h1>

      {/* Camera Controls */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {!isScanning ? (
          <button
            onClick={startCamera}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
          >
            <Camera size={20} /> Start Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
          >
            <CameraOff size={20} /> Stop Camera
          </button>
        )}
      </div>

      {/* File Upload */}
      <div className="mt-6 w-full max-w-md">
        <label className="block text-gray-700 font-medium mb-2 text-center sm:text-left">
          Or upload a barcode image:
        </label>
        <label className="flex items-center justify-center w-full px-4 py-3 bg-white border border-dashed border-indigo-400 rounded-lg cursor-pointer hover:bg-indigo-50 transition">
          <Upload className="mr-2 text-indigo-600" size={20} />
          <span className="text-indigo-600 font-medium">Choose File</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Uploaded Image Preview */}
      {uploadedImg && (
        <div className="mt-6 w-full flex justify-center">
          <img
            ref={imageRef}
            src={uploadedImg}
            alt="Uploaded barcode"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md border rounded-lg shadow-sm"
          />
        </div>
      )}

      {/* Video Preview */}
      <div className="mt-6 w-full flex justify-center">
        <video
          ref={videoRef}
          className="w-full max-w-xs sm:max-w-sm md:max-w-md h-48 sm:h-60 border rounded-xl shadow-md bg-black"
          autoPlay
          muted
        ></video>
      </div>

      {/* Status Messages */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-indigo-600">
          <Loader2 className="animate-spin" size={20} /> Fetching details...
        </div>
      )}
      {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}

      {/* Product Details */}
      {product && product.status === "success" && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{product.name}</h2>
          <p className="text-gray-600">
            Brand: <span className="font-medium">{product.brand}</span>
          </p>
          <p className="text-sm text-gray-700 mt-3">{product.ingredients}</p>
        </div>
      )}
    </div>
  );
}
