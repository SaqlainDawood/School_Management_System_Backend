// controllers/classController.js
import Class from '../models/Class.js';
import Section from '../models/Section.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import Timetable from '../models/Timetable.js';
import mongoose from 'mongoose';

// ============================================
// GET ALL CLASSES
// ============================================
export const getClasses = async (req, res) => {
  try {
    const { academicYear, search } = req.query;

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const classes = await Class.find(query)
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate('sections', 'name')
      .populate({
        path: 'students',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate({
        path: 'subjects.subject',
        select: 'name code',
      })
      .populate({
        path: 'subjects.teacher',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE CLASS
// ============================================
export const getClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate({
        path: 'classTeacher',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('sections', 'name code students')
      .populate({
        path: 'students',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('subjects.subject', 'name code')
      .populate({
        path: 'subjects.teacher',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE CLASS
// ============================================
export const createClass = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      academicYear,
      capacity,
      classTeacher,
      subjects,
      roomNumber,
      building,
    } = req.body;

    const existingClass = await Class.findOne({ code });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists',
      });
    }

    const classData = await Class.create({
      name,
      code,
      description: description || '',
      academicYear,
      capacity: capacity || 40,
      classTeacher: classTeacher || null,
      subjects: subjects || [],
      roomNumber: roomNumber || '',
      building: building || '',
      status: 'active',
    });

    if (classTeacher) {
      await Teacher.findByIdAndUpdate(classTeacher, {
        $push: { classes: classData._id },
      });
    }

    res.status(201).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE CLASS
// ============================================
export const updateClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      class: updatedClass,
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE CLASS - WITH DEPENDENCY CHECK
// ============================================
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Attempting to delete class:', id);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Check for dependent records
    const dependencies = [];

    const studentCount = await Student.countDocuments({ class: id });
    if (studentCount > 0) {
      dependencies.push({
        type: 'Students',
        count: studentCount,
        message: `${studentCount} student(s) are enrolled in this class`,
      });
    }

    const attendanceCount = await Attendance.countDocuments({ class: id });
    if (attendanceCount > 0) {
      dependencies.push({
        type: 'Attendance',
        count: attendanceCount,
        message: `${attendanceCount} attendance record(s) exist for this class`,
      });
    }

    const feeCount = await Fee.countDocuments({ class: id });
    if (feeCount > 0) {
      dependencies.push({
        type: 'Fees',
        count: feeCount,
        message: `${feeCount} fee record(s) exist for this class`,
      });
    }

    const resultCount = await Result.countDocuments({ classId: id });
    if (resultCount > 0) {
      dependencies.push({
        type: 'Results',
        count: resultCount,
        message: `${resultCount} result record(s) exist for this class`,
      });
    }

    const examCount = await Exam.countDocuments({ class: id });
    if (examCount > 0) {
      dependencies.push({
        type: 'Exams',
        count: examCount,
        message: `${examCount} exam(s) are scheduled for this class`,
      });
    }

    const timetableCount = await Timetable.countDocuments({ class: id });
    if (timetableCount > 0) {
      dependencies.push({
        type: 'Timetable',
        count: timetableCount,
        message: `${timetableCount} timetable entry(ies) exist for this class`,
      });
    }

    if (dependencies.length > 0) {
      console.log('❌ Cannot delete class - dependencies found:', dependencies);

      return res.status(400).json({
        success: false,
        message: 'Cannot delete class because it has dependent records',
        dependencies: dependencies,
        suggestion:
          'Please remove all students, subjects, teachers, attendance, fees, results, and exams from this class first, or archive the class instead of deleting.',
      });
    }

    console.log('✅ No dependencies found. Proceeding with deletion...');

    await Teacher.updateMany({ classes: id }, { $pull: { classes: id } });

    await Class.findByIdAndDelete(id);

    console.log('✅ Class deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete class error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete class',
    });
  }
};

// ============================================
// REMOVE STUDENT FROM CLASS
// ============================================
export const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    console.log(`👤 Removing student ${studentId} from class ${classId}`);

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (!classData.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this class',
      });
    }

    await Class.findByIdAndUpdate(classId, {
      $pull: { students: studentId },
    });

    await Student.findByIdAndUpdate(studentId, {
      $unset: { class: '' },
    });

    console.log('✅ Student removed from class successfully');

    res.status(200).json({
      success: true,
      message: 'Student removed from class successfully',
      studentId: studentId,
      className: classData.name,
    });
  } catch (error) {
    console.error('❌ Remove student from class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REMOVE ALL STUDENTS FROM CLASS
// ============================================
export const removeAllStudentsFromClass = async (req, res) => {
  try {
    const { classId } = req.params;

    console.log(`👥 Removing all students from class ${classId}`);

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const studentCount = classData.students.length;

    if (studentCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No students in this class to remove',
      });
    }

    await Student.updateMany({ class: classId }, { $unset: { class: '' } });

    await Class.findByIdAndUpdate(classId, {
      $set: { students: [] },
    });

    console.log(`✅ ${studentCount} students removed from class successfully`);

    res.status(200).json({
      success: true,
      message: `${studentCount} students removed from class successfully`,
      removedCount: studentCount,
      className: classData.name,
    });
  } catch (error) {
    console.error('❌ Remove all students from class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REMOVE SUBJECT FROM CLASS - WITH SUBJECT SYNC
// ============================================
export const removeSubjectFromClass = async (req, res) => {
  try {
    const { classId, subjectId } = req.params;

    console.log(`📚 Removing subject ${subjectId} from class ${classId}`);

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const subjectExists = classData.subjects.some(
      (s) => s.subject.toString() === subjectId
    );

    if (!subjectExists) {
      return res.status(400).json({
        success: false,
        message: 'Subject is not assigned to this class',
      });
    }

    const subjectAssignment = classData.subjects.find(
      (s) => s.subject.toString() === subjectId
    );

    await Class.findByIdAndUpdate(classId, {
      $pull: { subjects: { subject: subjectId } },
    });

    if (subjectAssignment && subjectAssignment.teacher) {
      await Teacher.findByIdAndUpdate(subjectAssignment.teacher, {
        $pull: { subjects: subjectId },
      });
    }

    // Sync: Remove class from Subject.classes
    await Subject.findByIdAndUpdate(subjectId, {
      $pull: { classes: classId },
    });

    console.log('✅ Subject removed from class successfully');

    res.status(200).json({
      success: true,
      message: 'Subject removed from class successfully',
      subjectId: subjectId,
      subjectName: subject.name,
      className: classData.name,
    });
  } catch (error) {
    console.error('❌ Remove subject from class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REMOVE ALL SUBJECTS FROM CLASS
// ============================================
export const removeAllSubjectsFromClass = async (req, res) => {
  try {
    const { classId } = req.params;

    console.log(`📚 Removing all subjects from class ${classId}`);

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const subjectCount = classData.subjects.length;

    if (subjectCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No subjects assigned to this class',
      });
    }

    const subjectIds = classData.subjects.map((s) => s.subject);
    const teacherIds = classData.subjects
      .map((s) => s.teacher)
      .filter(Boolean);

    if (teacherIds.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: teacherIds } },
        { $pull: { subjects: { $in: subjectIds } } }
      );
    }

    // Sync: Remove class from all subjects
    if (subjectIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $pull: { classes: classId } }
      );
    }

    await Class.findByIdAndUpdate(classId, {
      $set: { subjects: [] },
    });

    console.log(`✅ ${subjectCount} subjects removed from class successfully`);

    res.status(200).json({
      success: true,
      message: `${subjectCount} subjects removed from class successfully`,
      removedCount: subjectCount,
      className: classData.name,
    });
  } catch (error) {
    console.error('❌ Remove all subjects from class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CLASS STUDENTS
// ============================================
export const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const students = await Student.find({ class: id })
      .populate('user', 'name email phone')
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Get class students error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET CLASS SUBJECTS
// ============================================
export const getClassSubjects = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id)
      .populate('subjects.subject', 'name code')
      .populate('subjects.teacher', 'name teacherId');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      count: classData.subjects.length,
      subjects: classData.subjects,
    });
  } catch (error) {
    console.error('Get class subjects error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ARCHIVE CLASS
// ============================================
export const archiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    if (classData.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Class is already archived',
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        status: 'archived',
        archivedDate: new Date(),
        archivedBy: req.user.id,
      },
      { new: true }
    );

    await Student.updateMany({ class: id }, { status: 'inactive' });

    res.status(200).json({
      success: true,
      message: 'Class archived successfully',
      class: updatedClass,
    });
  } catch (error) {
    console.error('Archive class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// RESTORE CLASS
// ============================================
export const restoreClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        status: 'active',
        archivedDate: null,
        archivedBy: null,
      },
      { new: true }
    );

    await Student.updateMany({ class: id }, { status: 'active' });

    res.status(200).json({
      success: true,
      message: 'Class restored successfully',
      class: updatedClass,
    });
  } catch (error) {
    console.error('Restore class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ASSIGN TEACHER TO CLASS (Class Teacher - Incharge)
// ============================================
export const assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    classData.classTeacher = teacherId;
    await classData.save();

    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { classes: classData._id },
    });

    res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ASSIGN SUBJECT TO CLASS - WITH SUBJECT SYNC
// ============================================
export const assignSubject = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.body;
    const classData = await Class.findById(req.params.id);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found',
      });
    }

    const exists = classData.subjects.some(
      (s) => s.subject.toString() === subjectId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Subject already assigned to this class',
      });
    }

    // 1. Add to Class.subjects
    classData.subjects.push({
      subject: subjectId,
      teacher: teacherId,
      period: { perWeek: 5, duration: 45 },
    });
    await classData.save();

    // 2. Add to Teacher.subjects
    await Teacher.findByIdAndUpdate(teacherId, {
      $addToSet: { subjects: subjectId },
    });

    // 3. Add class to Subject.classes
    await Subject.findByIdAndUpdate(subjectId, {
      $addToSet: { classes: classData._id },
    });

    res.status(200).json({
      success: true,
      class: classData,
    });
  } catch (error) {
    console.error('Assign subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CLEAN DELETE - Remove All Dependencies Then Delete
// ============================================
export const cleanDeleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🧹 Clean deleting class:', id);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const studentCount = await Student.countDocuments({ class: id });
    const subjectCount = classData.subjects.length;

    if (studentCount > 0) {
      await Student.updateMany({ class: id }, { $unset: { class: '' } });
      console.log(`✅ Unassigned ${studentCount} students from class`);
    }

    if (subjectCount > 0) {
      const subjectIds = classData.subjects.map((s) => s.subject);
      const teacherIds = classData.subjects.map((s) => s.teacher).filter(Boolean);

      if (teacherIds.length > 0) {
        await Teacher.updateMany(
          { _id: { $in: teacherIds } },
          { $pull: { subjects: { $in: subjectIds } } }
        );
      }

      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $pull: { classes: id } }
      );

      console.log(`✅ Removed ${subjectCount} subjects from teachers`);
    }

    await Teacher.updateMany({ classes: id }, { $pull: { classes: id } });
    console.log('✅ Removed class from teachers');

    await Class.findByIdAndDelete(id);
    console.log('✅ Class deleted');

    res.status(200).json({
      success: true,
      message:
        'Class deleted successfully. All students, subjects, and teacher assignments were removed.',
      removed: {
        students: studentCount,
        subjects: subjectCount,
      },
    });
  } catch (error) {
    console.error('❌ Clean delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// FORCE DELETE - Delete Everything
// ============================================
export const forceDeleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Force deleting class:', id);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const students = await Student.find({ class: id });
    const studentIds = students.map((s) => s._id);

    if (studentIds.length > 0) {
      await Student.deleteMany({ class: id });
      console.log(`✅ Deleted ${studentIds.length} students`);
    }

    await Attendance.deleteMany({ class: id });
    await Fee.deleteMany({ class: id });
    await Result.deleteMany({ classId: id });
    await Exam.deleteMany({ class: id });
    await Timetable.deleteMany({ class: id });

    await Teacher.updateMany({ classes: id }, { $pull: { classes: id } });

    await Class.findByIdAndDelete(id);
    console.log('✅ Class deleted');

    res.status(200).json({
      success: true,
      message: 'Class and all related data deleted successfully',
      deleted: {
        students: studentIds.length,
      },
    });
  } catch (error) {
    console.error('❌ Force delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};