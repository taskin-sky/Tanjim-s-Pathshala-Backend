import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Owner from '../models/Owner.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const testLogin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const email = 'tanjimmubarrat99@gmail.com';
    const password = 'Tanjim2003030/Pathshala';

    console.log('\n📝 Looking for owner with email:', email);

    const owner = await Owner.findOne({ email });

    if (!owner) {
      console.log('❌ Owner not found with this email');
      console.log('Check if email matches exactly');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Owner found:', owner.name);
    console.log('Password in DB hash:', owner.password);

    // Test password comparison
    const isMatch = await bcrypt.compare(password, owner.password);

    console.log('\n🔐 Password test:');
    console.log('Entered password:', password);
    console.log('Password match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('\n⚠️ Password mismatch!');
      console.log('Either the stored hash is corrupted or password is wrong');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testLogin();
