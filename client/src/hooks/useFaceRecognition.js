import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const useFaceRecognition = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [employees, setEmployees] = useState([]);
  const labeledDescriptors = useRef([]);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading face-api models:', error);
    }
  };

  const loadEmployeeDescriptors = (employeeData) => {
    setEmployees(employeeData);
    labeledDescriptors.current = employeeData.map(employee => {
      const descriptors = [new Float32Array(employee.faceEmbedding)];
      return new faceapi.LabeledFaceDescriptors(
        employee.employeeId,
        descriptors
      );
    });
  };

  const detectFaces = async (video) => {
    if (!isLoaded || !video) return [];

    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  };

  const recognizeFaces = (detections) => {
    if (!detections.length || !labeledDescriptors.current.length) return [];

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors.current, 0.6);
    
    return detections.map(detection => {
      const match = faceMatcher.findBestMatch(detection.descriptor);
      const employee = employees.find(emp => emp.employeeId === match.label);
      
      return {
        detection,
        match: match.label !== 'unknown' ? {
          employeeId: match.label,
          name: employee?.name || 'Unknown',
          distance: match.distance,
          confidence: 1 - match.distance
        } : null
      };
    });
  };

  const getFaceEmbedding = async (imageElement) => {
    if (!isLoaded) return null;

    const detection = await faceapi
      .detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? Array.from(detection.descriptor) : null;
  };

  return {
    isLoaded,
    detectFaces,
    recognizeFaces,
    loadEmployeeDescriptors,
    getFaceEmbedding
  };
};

export default useFaceRecognition;