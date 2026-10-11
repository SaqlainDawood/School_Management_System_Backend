import Subject from '../models/Subject.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';

// ============================================
// GET ALL SUBJECTS
// ============================================
export const getSubjects = async (req, res) => {
  try {
    const { search, type, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const subjects = await Subject.find(query)
      .populate({
        path: 'teachers',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate('classes', 'name code')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE SUBJECT
// ============================================
export const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate({
        path: 'teachers',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate('classes', 'name code');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      subject,
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CREATE SUBJECT — WITH CLASS + TEACHER SYNC
// ============================================
export const createSubject = async (req, res) => {
  try {
    const { name, code, description, type, credits, classes, teachers } = req.body;

    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists',
      });
    }

    const subject = await Subject.create({
      name,
      code,
      description: description || '',
      type: type || 'core',
      credits: credits || 3,
      classes: classes || [],
      teachers: teachers || [],
    });

    // Sync: Add subject to each assigned Class
    if (classes && classes.length > 0) {
      const teacherId = teachers && teachers.length > 0 ? teachers[0] : null;

      for (const classId of classes) {
        const classData = await Class.findById(classId);
        if (classData) {
          const exists = classData.subjects.some(
            (s) => s.subject.toString() === subject._id.toString()
          );
          if (!exists) {
            classData.subjects.push({
              subject: subject._id,
              teacher: teacherId,
              period: { perWeek: 5, duration: 45 },
            });
            await classData.save();
          }
        }
      }
    }

    // Sync: Add subject to teachers
    if (teachers && teachers.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: teachers } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    const populatedSubject = await Subject.findById(subject._id)
      .populate('classes', 'name code')
      .populate({
        path: 'teachers',
        populate: { path: 'user', select: 'name email' },
      });

    res.status(201).json({
      success: true,
      subject: populatedSubject,
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE SUBJECT — WITH CLASS + TEACHER SYNC
// ============================================
export const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const oldClasses = (subject.classes || []).map((c) => String(c));
    const oldTeachers = (subject.teachers || []).map((t) => String(t));
    const newClasses = (req.body.classes || []).map((c) => String(c));
    const newTeachers = (req.body.teachers || []).map((t) => String(t));

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    const teacherId = newTeachers.length > 0 ? newTeachers[0] : null;

    // Sync: Classes REMOVED
    const removedClasses = oldClasses.filter((c) => !newClasses.includes(c));
    if (removedClasses.length > 0) {
      await Class.updateMany(
        { _id: { $in: removedClasses } },
        { $pull: { subjects: { subject: subject._id } } }
      );
    }

    // Sync: Classes ADDED
    const addedClasses = newClasses.filter((c) => !oldClasses.includes(c));
    if (addedClasses.length > 0) {
      for (const classId of addedClasses) {
        const classData = await Class.findById(classId);
        if (classData) {
          const exists = classData.subjects.some(
            (s) => s.subject.toString() === subject._id.toString()
          );
          if (!exists) {
            classData.subjects.push({
              subject: subject._id,
              teacher: teacherId,
              period: { perWeek: 5, duration: 45 },
            });
            await classData.save();
          }
        }
      }
    }

    // Sync: Update teacher in existing class assignments
    if (newClasses.length > 0 && teacherId) {
      await Class.updateMany(
        { 'subjects.subject': subject._id },
        { $set: { 'subjects.$.teacher': teacherId } }
      );
    }

    // Sync: Remove subject from old teachers
    const removedTeachers = oldTeachers.filter((t) => !newTeachers.includes(t));
    if (removedTeachers.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: removedTeachers } },
        { $pull: { subjects: subject._id } }
      );
    }

    // Sync: Add subject to new teachers
    const addedTeachers = newTeachers.filter((t) => !oldTeachers.includes(t));
    if (addedTeachers.length > 0) {
      await Teacher.updateMany(
        { _id: { $in: addedTeachers } },
        { $addToSet: { subjects: subject._id } }
      );
    }

    const populatedSubject = await Subject.findById(updatedSubject._id)
      .populate('classes', 'name code')
      .populate({
        path: 'teachers',
        populate: { path: 'user', select: 'name email' },
      });

    res.status(200).json({
      success: true,
      subject: populatedSubject,
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE SUBJECT
// ============================================
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    await Class.updateMany(
      { 'subjects.subject': subject._id },
      { $pull: { subjects: { subject: subject._id } } }
    );

    await Teacher.updateMany(
      { subjects: subject._id },
      { $pull: { subjects: subject._id } }
    );

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ASSIGN TEACHER TO SUBJECT
// ============================================
export const assignTeacherToSubject = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

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

    if (subject.teachers.includes(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'Teacher already assigned to this subject',
      });
    }

    subject.teachers.push(teacherId);
    await subject.save();

    if (!teacher.subjects.includes(subject._id)) {
      teacher.subjects.push(subject._id);
      await teacher.save();
    }

    res.status(200).json({
      success: true,
      message: 'Teacher assigned to subject successfully',
      subject,
    });
  } catch (error) {
    console.error('Assign teacher to subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// REMOVE TEACHER FROM SUBJECT
// ============================================
export const removeTeacherFromSubject = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    subject.teachers = subject.teachers.filter(
      (id) => id.toString() !== teacherId
    );
    await subject.save();

    await Teacher.findByIdAndUpdate(teacherId, {
      $pull: { subjects: subject._id },
    });

    res.status(200).json({
      success: true,
      message: 'Teacher removed from subject successfully',
      subject,
    });
  } catch (error) {
    console.error('Remove teacher from subject error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SUBJECT TEACHERS
// ============================================
export const getSubjectTeachers = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate({
      path: 'teachers',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      teachers: subject.teachers,
    });
  } catch (error) {
    console.error('Get subject teachers error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};