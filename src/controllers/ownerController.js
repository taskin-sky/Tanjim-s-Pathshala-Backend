import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Review from '../models/Review.js';
import Contact from '../models/Contact.js';
import generatePasskey from '../utils/generatePasskey.js';
import bcrypt from 'bcryptjs';

// ========== HELPER FUNCTIONS ==========
const generateToken = (id, role) => {
  return jwt.sign({ id, role: 'owner' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ========== AUTH CONTROLLERS ==========
export const ownerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const owner = await Owner.findOne({ email });

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordMatch = await owner.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: owner._id, role: 'owner' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Set cookie options
    const cookieOptions = {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENVIRONMENT === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Set token in cookie
    res.cookie('owner-token', token, cookieOptions);

    res.json({
      success: true,
      token, // Also return token for mobile apps / Postman
      data: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        profileImage: owner.profileImage,
        bio: owner.bio,
        teachingStyle: owner.teachingStyle,
        achievements: owner.achievements,
      },
    });
  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const ownerLogout = async (req, res) => {
  try {
    res.clearCookie('owner-token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== PROFILE CONTROLLERS ==========
export const getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select('-password');

    res.json({
      success: true,
      owner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateOwnerProfile = async (req, res) => {
  try {
    const { bio, teachingStyle, achievements, profileImage } = req.body;

    const owner = await Owner.findById(req.user.id);

    if (bio) owner.bio = bio;
    if (teachingStyle) owner.teachingStyle = teachingStyle;
    if (achievements) owner.achievements = achievements;
    if (profileImage) owner.profileImage = profileImage;

    owner.updatedAt = Date.now();
    await owner.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        bio: owner.bio,
        teachingStyle: owner.teachingStyle,
        achievements: owner.achievements,
        profileImage: owner.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const owner = await Owner.findById(req.user.id);

    const isMatch = await owner.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    owner.password = newPassword;
    owner.updatedAt = Date.now();
    await owner.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== STUDENT MANAGEMENT ==========
export const createStudent = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Student name is required',
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ name });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this name already exists',
      });
    }

    // Generate unique passkey
    let passkey;
    let isUnique = false;

    while (!isUnique) {
      passkey = generatePasskey();
      const existing = await Student.findOne({ passkey });
      if (!existing) isUnique = true;
    }

    const student = new Student({
      name,
      passkey,
      email,
      phone,
      address,
      createdBy: req.user.id,
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: {
        id: student._id,
        name: student.name,
        passkey: student.passkey,
        email: student.email,
        phone: student.phone,
        address: student.address,
        isActive: student.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ createdBy: req.user.id })
      .select('-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).select('-__v');

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

export const updateStudent = async (req, res) => {
  try {
    const { name, phone, address, isActive } = req.body;

    const student = await Student.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Email cannot be changed (only owner can set initially)
    if (name) student.name = name;
    if (phone) student.phone = phone;
    if (address) student.address = address;
    if (typeof isActive === 'boolean') student.isActive = isActive;

    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetStudentPasskey = async (req, res) => {
  try {
    const student = await Student.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    let newPasskey;
    let isUnique = false;

    while (!isUnique) {
      newPasskey = generatePasskey();
      const existing = await Student.findOne({ passkey: newPasskey });
      if (!existing) isUnique = true;
    }

    student.passkey = newPasskey;
    student.updatedAt = Date.now();
    await student.save();

    res.json({
      success: true,
      message: 'Passkey reset successfully',
      newPasskey: student.passkey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== CLASS MANAGEMENT ==========
export const createClass = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      googleMeetLink,
      subject,
      classLevel,
      createdFor,
    } = req.body;

    console.log('📅 Creating class with date:', date);
    console.log('⏰ Time:', time);
    console.log('📊 Full date object:', new Date(date));

    // Fix: Combine date and time properly
    const combinedDateTime = new Date(`${date}T${time}:00`);
    console.log('🔧 Combined DateTime:', combinedDateTime);
    console.log('🕐 Current time:', new Date());

    if (
      !title ||
      !date ||
      !time ||
      !googleMeetLink ||
      !subject ||
      !classLevel
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const newClass = new Class({
      title,
      description,
      date: combinedDateTime, // Store as proper DateTime
      time,
      googleMeetLink,
      subject,
      classLevel,
      createdFor: createdFor || [],
      createdBy: req.user.id,
    });

    await newClass.save();

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({ createdBy: req.user.id })
      .populate('createdFor', 'name passkey')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate('createdFor', 'name email');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.json({
      success: true,
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateClass = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      googleMeetLink,
      subject,
      classLevel,
      createdFor,
      isActive,
    } = req.body;

    const classData = await Class.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    if (title) classData.title = title;
    if (description) classData.description = description;
    if (date) classData.date = date;
    if (time) classData.time = time;
    if (googleMeetLink) classData.googleMeetLink = googleMeetLink;
    if (subject) classData.subject = subject;
    if (classLevel) classData.classLevel = classLevel;
    if (createdFor) classData.createdFor = createdFor;
    if (typeof isActive === 'boolean') classData.isActive = isActive;

    await classData.save();

    res.json({
      success: true,
      message: 'Class updated successfully',
      class: classData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== REVIEW MANAGEMENT ==========
export const getStudentReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });

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

export const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    review.isApproved = true;
    await review.save();

    res.json({
      success: true,
      message: 'Review approved successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== DASHBOARD STATS ==========
export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({
      createdBy: req.user.id,
    });
    const activeStudents = await Student.countDocuments({
      createdBy: req.user.id,
      isActive: true,
    });
    const totalClasses = await Class.countDocuments({ createdBy: req.user.id });
    const upcomingClasses = await Class.countDocuments({
      createdBy: req.user.id,
      date: { $gte: new Date() },
      isActive: true,
    });
    const totalReviews = await Review.countDocuments({ isApproved: true });
    const averageRating = await Review.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalClasses,
        upcomingClasses,
        totalReviews,
        averageRating: averageRating[0]?.avgRating || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== CONTACT MANAGEMENT ==========
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1, isRead: 1 });

    const unreadCount = await Contact.countDocuments({ isRead: false });

    res.json({
      success: true,
      stats: {
        total: contacts.length,
        unread: unreadCount,
        read: contacts.length - unreadCount,
      },
      contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single contact message (Owner only)
// @route   GET /api/owner/contacts/:id
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    // Mark as read if not already
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.json({
      success: true,
      contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark contact as replied (Owner only)
// @route   PUT /api/owner/contacts/:id/reply
export const markAsReplied = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    contact.replied = true;
    contact.repliedAt = Date.now();
    contact.isRead = true;

    await contact.save();

    // Here you can also send email notification
    // await sendEmail(contact.email, 'Response to your query', replyMessage);

    res.json({
      success: true,
      message: 'Marked as replied successfully',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        replied: contact.replied,
        repliedAt: contact.repliedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete contact message (Owner only)
// @route   DELETE /api/owner/contacts/:id
export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
      });
    }

    res.json({
      success: true,
      message: 'Contact message deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
