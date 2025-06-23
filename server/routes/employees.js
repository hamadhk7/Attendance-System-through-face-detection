const express = require('express');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

const router = express.Router();

// Add employee
router.post('/', auth, async (req, res) => {
  try {
    const { name, employeeId, faceEmbedding, profilePhoto } = req.body;

    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    const employee = new Employee({
      name,
      employeeId,
      faceEmbedding,
      profilePhoto
    });

    await employee.save();
    res.status(201).json({ message: 'Employee added successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all employees with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employees = await Employee.find({ isActive: true })
      .select('-faceEmbedding')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments({ isActive: true });

    res.json({
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee embeddings for face recognition
router.get('/embeddings', auth, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('employeeId name faceEmbedding');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;