const express = require('express');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const UnknownFace = require('../models/UnknownFace');
const auth = require('../middleware/auth');

const router = express.Router();

// Log attendance (check-in/check-out)
router.post('/log', auth, async (req, res) => {
  try {
    const { employeeId, employeeName } = req.body;
    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({ employeeId, date: today });

    if (!attendance) {
      // First time today - check in
      attendance = new Attendance({
        employeeId,
        employeeName,
        date: today,
        status: 'checked-in'
      });
    } else if (attendance.status === 'checked-in') {
      // Already checked in - check out
      const now = new Date();
      const checkInTime = new Date(attendance.checkIn);
      const hoursDiff = (now - checkInTime) / (1000 * 60 * 60);

      if (hoursDiff >= 1) { // Configurable interval
        attendance.checkOut = now;
        attendance.status = 'checked-out';
      } else {
        return res.status(400).json({ 
          message: 'Must wait at least 1 hour before checking out' 
        });
      }
    } else {
      return res.status(400).json({ 
        message: 'Already checked out for today' 
      });
    }

    await attendance.save();
    res.json({ message: 'Attendance logged successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for a specific date
router.get('/', auth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    const attendanceRecords = await Attendance.find({ date })
      .sort({ checkIn: -1 });

    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Log unknown face
router.post('/unknown', auth, async (req, res) => {
  try {
    const { confidence, image } = req.body;

    const unknownFace = new UnknownFace({
      confidence,
      image
    });

    await unknownFace.save();

    // Emit real-time alert
    req.app.get('io').emit('unknownFaceDetected', {
      id: unknownFace._id,
      detectedAt: unknownFace.detectedAt,
      confidence
    });

    res.status(201).json({ message: 'Unknown face logged', unknownFace });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get unknown faces
router.get('/unknown', auth, async (req, res) => {
  try {
    const unknownFaces = await UnknownFace.find()
      .sort({ detectedAt: -1 })
      .limit(50);
    res.json(unknownFaces);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;