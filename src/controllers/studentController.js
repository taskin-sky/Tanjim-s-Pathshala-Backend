import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Review from '../models/Review.js';

// ========== HELPER FUNCTIONS ==========
const generateToken = (id, role) => {
  return jwt.sign({ id, role: 'student' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ========== AUTH CONTROLLERS ==========
export const studentLogin = async (req, res) => {
  try {
    const { name, passkey } = req.body;

    if (!name || !passkey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and passkey',
      });
    }

    const student = await Student.findOne({
      name: name.trim(),
      passkey,
    });

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid name or passkey',
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact owner.',
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: student._id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENVIRONMENT === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Set token in cookie
    res.cookie('student-token', token, cookieOptions);

    res.json({
      success: true,
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        profileImage: student.profileImage,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ========== PROFILE CONTROLLERS ==========
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select(
      '-passkey -__v -createdBy'
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStudentProfile = async (req, res) => {
  try {
    const { name, phone, address, profileImage } = req.body;

    const student = await Student.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Name cannot be changed (only owner can change)
    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (address) student.address = address;
    if (profileImage) student.profileImage = profileImage;

    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        address: student.address,
        profileImage: student.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== CLASS CONTROLLERS ==========

export const getMyClasses = async (req, res) => {
  try {
    const currentDate = new Date();

    // Find classes where this student is in createdFor array OR createdFor is empty (all students)
    const classes = await Class.find({
      isActive: true,
      $or: [{ createdFor: { $eq: [] } }, { createdFor: req.user.id }],
    }).sort({ date: 1, time: 1 });

    // Separate upcoming and past classes using actual date comparison
    const upcomingClasses = [];
    const pastClasses = [];

    for (const cls of classes) {
      // Create proper date object from stored date
      const classDateTime = new Date(cls.date);

      if (classDateTime > currentDate) {
        // Check if can join (30 minutes before)
        const joinTime = new Date(classDateTime);
        joinTime.setMinutes(joinTime.getMinutes() - 30);
        const canJoinNow = currentDate >= joinTime;

        upcomingClasses.push({
          ...cls.toObject(),
          canJoin: canJoinNow,
          classDateTime: classDateTime,
        });
      } else {
        pastClasses.push(cls.toObject());
      }
    }

    res.json({
      success: true,
      stats: {
        total: classes.length,
        upcoming: upcomingClasses.length,
        past: pastClasses.length,
      },
      upcomingClasses,
      pastClasses,
    });
  } catch (error) {
    console.error('Get my classes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClassDetails = async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.id,
      isActive: true,
      $or: [{ createdFor: { $eq: [] } }, { createdFor: req.user.id }],
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you dont have access',
      });
    }

    // Check if class has started (can join 30 minutes before)
    const classDateTime = new Date(classData.date);
    const classTimeParts = classData.time.split(':');
    classDateTime.setHours(
      parseInt(classTimeParts[0]),
      parseInt(classTimeParts[1]),
      0
    );

    const now = new Date();
    const canJoin = now >= new Date(classDateTime.getTime() - 30 * 60000); // 30 minutes before

    res.json({
      success: true,
      class: {
        _id: classData._id,
        title: classData.title,
        description: classData.description,
        date: classData.date,
        time: classData.time,
        subject: classData.subject,
        classLevel: classData.classLevel,
        googleMeetLink: classData.googleMeetLink,
        canJoin: canJoin,
        isActive: classData.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinClass = async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.id,
      isActive: true,
      $or: [{ createdFor: { $eq: [] } }, { createdFor: req.user.id }],
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found or you don't have access",
      });
    }

    const now = new Date();
    const classDateTime = new Date(classData.date);

    // Calculate join time (30 minutes before class)
    const joinTime = new Date(classDateTime);
    joinTime.setMinutes(joinTime.getMinutes() - 30);

    // Check if class has ended
    if (now > classDateTime) {
      return res.status(400).json({
        success: false,
        message: `This class has already ended. Class was on ${classDateTime.toLocaleString()}`,
      });
    }

    // Check if can join yet
    if (now < joinTime) {
      const minutesToWait = Math.ceil((joinTime - now) / (1000 * 60));
      return res.status(400).json({
        success: false,
        message: `You can join this class ${minutesToWait} minutes before start time. Class starts at ${classData.time} on ${classDateTime.toLocaleDateString()}`,
        classStartTime: classData.time,
        classDate: classData.date,
        canJoinAt: joinTime,
      });
    }

    // Student can join
    res.json({
      success: true,
      message: 'You can join the class now',
      googleMeetLink: classData.googleMeetLink,
      classDetails: {
        title: classData.title,
        date: classData.date,
        time: classData.time,
        subject: classData.subject,
      },
    });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== REVIEW CONTROLLERS ==========
export const submitReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;

    if (!comment || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment and rating',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if student already submitted a review
    const existingReview = await Review.findOne({ studentId: req.user.id });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message:
          'You have already submitted a review. You can update it instead.',
      });
    }

    const review = new Review({
      studentId: req.user.id,
      studentName: req.user.name,
      comment,
      rating,
      isApproved: false, // Needs owner approval
    });

    await review.save();

    res.status(201).json({
      success: true,
      message:
        'Review submitted successfully. It will be displayed after owner approval.',
      review: {
        id: review._id,
        comment: review.comment,
        rating: review.rating,
        isApproved: review.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const reviewId = req.params.id;

    const review = await Review.findOne({
      _id: reviewId,
      studentId: req.user.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    if (comment) review.comment = comment;
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }
      review.rating = rating;
    }

    // Reset approval status after update
    review.isApproved = false;
    review.createdAt = Date.now();

    await review.save();

    res.json({
      success: true,
      message: 'Review updated successfully. Need owner approval again.',
      review: {
        id: review._id,
        comment: review.comment,
        rating: review.rating,
        isApproved: review.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ studentId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
