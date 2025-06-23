import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { employeeAPI } from '../utils/api';
import useFaceRecognition from '../hooks/useFaceRecognition';
import { toast } from 'react-toastify';
import { UserPlus, Users, Trash2 } from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', employeeId: '' });
  const [capturedImage, setCapturedImage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  
  const webcamRef = useRef(null);
  const { isLoaded, getFaceEmbedding } = useFaceRecognition();

  useEffect(() => {
    fetchEmployees();
  }, [pagination.page]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll({ page: pagination.page });
      setEmployees(response.data.employees);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setIsCapturing(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.employeeId || !capturedImage) {
      toast.error('Please fill all fields and capture a photo');
      return;
    }

    if (!isLoaded) {
      toast.error('Face recognition models not loaded yet');
      return;
    }

    try {
      // Create image element from captured photo
      const img = new Image();
      img.onload = async () => {
        const embedding = await getFaceEmbedding(img);
        
        if (!embedding) {
          toast.error('No face detected in the photo. Please retake.');
          return;
        }

        try {
          await employeeAPI.create({
            ...newEmployee,
            faceEmbedding: embedding,
            profilePhoto: capturedImage
          });
          
          toast.success('Employee added successfully!');
          setNewEmployee({ name: '', employeeId: '' });
          setCapturedImage(null);
          setShowAddForm(false);
          fetchEmployees();
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to add employee');
        }
      };
      img.src = capturedImage;
    } catch (error) {
      toast.error('Failed to process face embedding');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="mr-2" />
          Employee Management
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input
                  type="text"
                  value={newEmployee.employeeId}
                  onChange={(e) => setNewEmployee({...newEmployee, employeeId: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee ID"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleAddEmployee}
                  disabled={!capturedImage}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                >
                  Add Employee
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setCapturedImage(null);
                    setNewEmployee({ name: '', employeeId: '' });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
              
              {!capturedImage ? (
                <div className="space-y-2">
                  {isCapturing ? (
                    <div className="space-y-2">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full rounded-md"
                        videoConstraints={{ width: 300, height: 225, facingMode: "user" }}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={capturePhoto}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Capture
                        </button>
                        <button
                          onClick={() => setIsCapturing(false)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCapturing(true)}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-blue-500"
                    >
                      <span className="text-gray-500">Click to capture photo</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-1 rounded text-sm"
                  >
                    Retake Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Employees ({pagination.total})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={employee.profilePhoto}
                      alt={employee.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(employee.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteEmployee(employee._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;