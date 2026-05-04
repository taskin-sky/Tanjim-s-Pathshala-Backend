import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  passkey: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
    unique: true,
    immutable: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  enrolledClasses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
