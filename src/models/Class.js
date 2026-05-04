import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  googleMeetLink: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  classLevel: {
    type: String,
    required: true,
    trim: true,
  },
  createdFor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add virtual field to check if class is upcoming
classSchema.virtual('isUpcoming').get(function () {
  const now = new Date();
  return this.date > now;
});

// Add virtual field to check if class can be joined (30 mins before)
classSchema.virtual('canJoin').get(function () {
  const now = new Date();
  const joinTime = new Date(this.date);
  joinTime.setMinutes(joinTime.getMinutes() - 30);
  return now >= joinTime && now < this.date;
});

const Class = mongoose.model('Class', classSchema);
export default Class;
