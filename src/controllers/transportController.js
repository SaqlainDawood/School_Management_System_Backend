import Transport from '../models/Transport.js';
import Student from '../models/Student.js';

// ============================================
// CREATE TRANSPORT
// ============================================
export const createTransport = async (req, res) => {
  try {
    const transport = await Transport.create(req.body);

    res.status(201).json({
      success: true,
      transport,
    });
  } catch (error) {
    console.error('Create transport error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL TRANSPORTS
// ============================================
export const getTransports = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { busNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
      ];
    }

    const transports = await Transport.find(query)
      .populate('students', 'name rollNumber')
      .sort({ busNumber: 1 });

    res.status(200).json({
      success: true,
      count: transports.length,
      transports,
    });
  } catch (error) {
    console.error('Get transports error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE TRANSPORT
// ============================================
export const getTransport = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id).populate(
      'students',
      'name rollNumber'
    );

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    res.status(200).json({
      success: true,
      transport,
    });
  } catch (error) {
    console.error('Get transport error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE TRANSPORT
// ============================================
export const updateTransport = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    const updatedTransport = await Transport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      transport: updatedTransport,
    });
  } catch (error) {
    console.error('Update transport error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE TRANSPORT
// ============================================
export const deleteTransport = async (req, res) => {
  try {
    const transport = await Transport.findById(req.params.id);
    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    await Transport.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Transport deleted successfully',
    });
  } catch (error) {
    console.error('Delete transport error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ASSIGN STUDENT TO TRANSPORT
// ============================================
export const assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (transport.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already assigned to this transport',
      });
    }

    if (transport.students.length >= transport.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Transport is full',
      });
    }

    transport.students.push(studentId);
    await transport.save();

    res.status(200).json({
      success: true,
      transport,
    });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REMOVE STUDENT FROM TRANSPORT
// ============================================
export const removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const transport = await Transport.findById(req.params.id);

    if (!transport) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found',
      });
    }

    transport.students = transport.students.filter(
      (id) => id.toString() !== studentId
    );
    await transport.save();

    res.status(200).json({
      success: true,
      transport,
    });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT TRANSPORT
// ============================================
export const getStudentTransport = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const transport = await Transport.findOne({
      students: studentId,
      status: 'active',
    });

    res.status(200).json({
      success: true,
      transport,
    });
  } catch (error) {
    console.error('Get student transport error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};