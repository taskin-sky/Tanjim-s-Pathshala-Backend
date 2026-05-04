import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import Owner from '../models/Owner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createOwner = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    // Delete existing owner if any
    await Owner.deleteMany({});
    console.log('🗑️ Removed existing owners');

    const email = process.env.OWNER_EMAIL || 'tanjimmubarrat99@gmail.com';
    const password = process.env.OWNER_PASSWORD || 'Tanjim2003030/Pathshala';

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const owner = new Owner({
      email: email,
      password: hashedPassword,
      bio: 'Experienced tutor passionate about teaching',
      teachingStyle: 'Interactive and student-focused',
      achievements: ['Best Tutor Award 2023', '1000+ Students Taught'],
    });

    await owner.save();

    console.log('\n✅ Owner created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🔐 Hashed Password:', owner.password);

    // Verify password works
    const verifyMatch = await bcrypt.compare(password, owner.password);
    console.log('✅ Password verification:', verifyMatch ? 'PASS' : 'FAIL');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createOwner();
