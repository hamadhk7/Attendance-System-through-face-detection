import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import useFaceRecognition from '../hooks/useFaceRecognition';
import { employeeAPI, attendanceAPI } from '../utils/api';
import { toast } from 'react-toastify';

const LiveView = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const lastRecognitionRef = useRef({});
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [recognizedFaces, setRecognizedFaces] = useState([]);
  
  const { isLoaded, detectFaces, recognizeFaces, loadEmployeeDescriptors } = useFaceRecognition();

  useEffect(() => {
    if (isLoaded) {
      loadEmployees();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isDetecting) {
      startDetection();
    } else {
      stopDetection();
    }
    
    return () => stopDetection();
  }, [isDetecting]);

  const loadEmployees = async () => {
    try {
      const response = await employeeAPI.getEmbeddings();
      loadEmployeeDescriptors(response.data);
    } catch (error) {
      toast.error('Failed to load employee data');
    }
  };

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      await detectAndRecognize();
    }, 1000);
  };

  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const detectAndRecognize = async () => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== 4) return;

    const detections = await detectFaces(video);
    const recognitionResults = recognizeFaces(detections);

    // Clear canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw detections and recognition results
    recognitionResults.forEach(({ detection, match }) => {
      const { x, y, width, height } = detection.detection.box;
      
      // Draw bounding box
      ctx.strokeStyle = match ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      
      // Draw name label
      const label = match ? match.name : 'Unknown';
      ctx.fillStyle = match ? '#00ff00' : '#ff0000';
      ctx.font = '16px Arial';
      ctx.fillText(label, x, y - 10);

      // Handle attendance logging
      if (match) {
        handleAttendanceLogging(match);
      } else {
        handleUnknownFace(detection);
      }
    });

    setRecognizedFaces(recognitionResults.filter(r => r.match));
  };

  const handleAttendanceLogging = async (match) => {
    const now = Date.now();
    const lastRecognition = lastRecognitionRef.current[match.employeeId];
    
    // Prevent multiple logs within 30 seconds
    if (lastRecognition && now - lastRecognition < 30000) return;
    
    lastRecognitionRef.current[match.employeeId] = now;

    try {
      await attendanceAPI.log({
        employeeId: match.employeeId,
        employeeName: match.name
      });
      toast.success(`Attendance logged for ${match.name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log attendance');
    }
  };

  const handleUnknownFace = async (detection) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = webcamRef.current?.video;
    
    if (!video) return;

    const { x, y, width, height } = detection.detection.box;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(video, x, y, width, height, 0, 0, width, height);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      await attendanceAPI.logUnknown({
        confidence: 0.5,
        image: imageData
      });
    } catch (error) {
      console.error('Failed to log unknown face:', error);
    }
  };

  const handleStartStop = () => {
    setIsDetecting(!isDetecting);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Face Recognition</h2>
        <button
          onClick={handleStartStop}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isDetecting 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isDetecting ? 'Stop Detection' : 'Start Detection'}
        </button>
      </div>

      <div className="relative">
        <Webcam
          ref={webcamRef}
          className="w-full max-w-2xl rounded-lg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          width={640}
          height={480}
        />
      </div>

      {recognizedFaces.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Currently Detected:</h3>
          <div className="space-y-2">
            {recognizedFaces.map((face, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="font-medium">{face.match.name}</span>
                <span className="text-sm text-gray-600">
                  Confidence: {(face.match.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveView;