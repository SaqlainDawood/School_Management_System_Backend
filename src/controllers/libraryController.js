import Book from '../models/Book.js';
import Student from '../models/Student.js';

// ============================================
// CREATE BOOK
// ============================================
export const createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET ALL BOOKS
// ============================================
export const getBooks = async (req, res) => {
  try {
    const { category, search, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    const books = await Book.find(query)
      .populate('borrowings.student', 'name rollNumber')
      .sort({ title: 1 });

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET SINGLE BOOK
// ============================================
export const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate(
      'borrowings.student',
      'name rollNumber'
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// UPDATE BOOK
// ============================================
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      book: updatedBook,
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DELETE BOOK
// ============================================
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// BORROW BOOK
// ============================================
export const borrowBook = async (req, res) => {
  try {
    const { studentId } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    book.borrowings.push({
      student: studentId,
      borrowDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'borrowed',
    });

    book.available -= 1;
    await book.save();

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// RETURN BOOK
// ============================================
export const returnBook = async (req, res) => {
  try {
    const { borrowingId } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const borrowing = book.borrowings.id(borrowingId);
    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'Borrowing record not found',
      });
    }

    borrowing.returnDate = new Date();
    borrowing.status = 'returned';

    if (borrowing.returnDate > borrowing.dueDate) {
      const daysLate = Math.ceil(
        (borrowing.returnDate - borrowing.dueDate) / (1000 * 60 * 60 * 24)
      );
      borrowing.fine = daysLate * 1;
    }

    book.available += 1;
    await book.save();

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET STUDENT BOOKS
// ============================================
export const getStudentBooks = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const books = await Book.find({
      'borrowings.student': studentId,
      'borrowings.status': 'borrowed',
    });

    res.status(200).json({
      success: true,
      books,
    });
  } catch (error) {
    console.error('Get student books error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// GET AVAILABLE BOOKS
// ============================================
export const getAvailableBooks = async (req, res) => {
  try {
    const books = await Book.find({
      available: { $gt: 0 },
      isActive: true,
    }).sort({ title: 1 });

    res.status(200).json({
      success: true,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('Get available books error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};