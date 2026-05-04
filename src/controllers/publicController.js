import Class from '../models/Class.js';
import Review from '../models/Review.js';
import Owner from '../models/Owner.js';
import Contact from '../models/Contact.js';

// ========== CLASS CONTROLLERS ==========
export const getPublicClasses = async (req, res) => {
  try {
    const currentDate = new Date();

    // Get only active and upcoming classes (not expired)
    const classes = await Class.find({
      isActive: true,
      date: { $gte: currentDate }, // Only upcoming classes
    })
      .select('title description date time subject classLevel')
      .sort({ date: 1, time: 1 })
      .limit(10); // Show only upcoming 10 classes

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

// ========== SUBJECTS CONTROLLER ==========
export const getPublicSubjects = async (req, res) => {
  try {
    // Get unique subjects from classes
    const subjects = await Class.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$subject',
          classLevels: { $addToSet: '$classLevel' },
          totalClasses: { $sum: 1 },
          latestClass: { $max: '$date' },
        },
      },
      {
        $project: {
          subject: '$_id',
          classLevels: 1,
          totalClasses: 1,
          latestClass: 1,
          _id: 0,
        },
      },
      { $sort: { subject: 1 } },
    ]);

    res.json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== REVIEWS CONTROLLER ==========
export const getApprovedReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .select('studentName comment rating createdAt')
      .sort({ createdAt: -1 })
      .limit(20); // Show last 20 approved reviews

    // Calculate average rating
    const averageRatingResult = await Review.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = averageRatingResult[0]?.averageRating || 0;
    const totalReviews = averageRatingResult[0]?.totalReviews || 0;

    res.json({
      success: true,
      stats: {
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews,
      },
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== ABOUT CONTROLLER ==========
export const getAboutInfo = async (req, res) => {
  try {
    const owner = await Owner.findOne().select(
      'name bio teachingStyle achievements profileImage'
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner information not found',
      });
    }

    // Get statistics for about page
    const totalClasses = await Class.countDocuments({ isActive: true });
    const totalStudents = await Class.aggregate([
      { $unwind: { path: '$createdFor', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, uniqueStudents: { $addToSet: '$createdFor' } } },
    ]);

    const uniqueStudentCount =
      totalStudents[0]?.uniqueStudents.filter((s) => s).length || 0;

    const stats = {
      totalClasses,
      totalStudents: uniqueStudentCount,
      totalReviews: await Review.countDocuments({ isApproved: true }),
    };

    res.json({
      success: true,
      owner: {
        name: owner.name,
        bio: owner.bio,
        teachingStyle: owner.teachingStyle,
        achievements: owner.achievements,
        profileImage: owner.profileImage,
      },
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== OWNER INFO CONTROLLER ==========
export const getOwnerInfo = async (req, res) => {
  try {
    const owner = await Owner.findOne().select(
      'name email bio teachingStyle achievements profileImage createdAt'
    );

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    res.json({
      success: true,
      owner: {
        name: owner.name,
        bio: owner.bio,
        teachingStyle: owner.teachingStyle,
        achievements: owner.achievements,
        profileImage: owner.profileImage,
        memberSince: owner.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ========== CONTACT CONTROLLER ==========
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields: name, email, subject, message',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Create contact message
    const contact = new Contact({
      name,
      email,
      subject,
      message,
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message:
        'Your message has been sent successfully. Owner will respond soon.',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt,
      },
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};
