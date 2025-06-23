import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { AlertTriangle, Eye } from 'lucide-react';
import io from 'socket.io-client';

const AlertsPanel = () => {
  const [unknownFaces, setUnknownFaces] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchUnknownFaces();
    setupSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('unknownFaceDetected', (alert) => {
      setUnknownFaces(prev => [alert, ...prev]);
      toast.warning(`Unknown face detected at ${new Date(alert.detectedAt).toLocaleTimeString()}`);
    });

    setSocket(newSocket);
  };

  const fetchUnknownFaces = async () => {
    try {
      const response = await attendanceAPI.getUnknown();
      setUnknownFaces(response.data);
    } catch (error) {
      toast.error('Failed to fetch unknown face alerts');
    }
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <AlertTriangle className="mr-2 text-yellow-600" />
          Security Alerts
        </h2>
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live monitoring active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Unknown Face Detections ({unknownFaces.length})</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {unknownFaces.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No unknown face alerts recorded
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {unknownFaces.map((alert) => (
                  <div
                    key={alert._id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedAlert?._id === alert._id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Unknown Person Detected
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(alert.detectedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Confidence: {(alert.confidence * 100).toFixed(1)}%
                        </span>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alert Details */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Alert Details</h3>
          </div>
          
          <div className="p-6">
            {selectedAlert ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detected Image
                  </label>
                  <img
                    src={selectedAlert.image}
                    alt="Unknown face"
                    className="w-full h-48 object-cover rounded-md border border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Detection Time
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(selectedAlert.detectedAt)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confidence Level
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${selectedAlert.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">
                      {(selectedAlert.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">
                        Security Alert
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        An unrecognized person was detected. Consider investigating or adding them to the employee database if authorized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an alert to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;