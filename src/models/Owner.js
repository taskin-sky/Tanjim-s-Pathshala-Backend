import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Tanjim Mohammad Mubarrat',
    immutable: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    immutable: true,
  },
  password: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  teachingStyle: {
    type: String,
    default: '',
  },
  achievements: [
    {
      type: String,
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

// Hash password before save - FIXED VERSION
ownerSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  if (this.password) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

// Compare password method - FIXED VERSION
ownerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

const Owner = mongoose.model('Owner', ownerSchema);
export default Owner;
