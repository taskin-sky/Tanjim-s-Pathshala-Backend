import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const migrateToCleanDB = async () => {
  try {
    // Connect to old database (with special characters)
    const oldURI =
      "mongodb+srv://taskinmubassir_db_user:ptR72Kx2QVc1wvaX@cluster0.expaq2d.mongodb.net/Tanjim's_Pathshala?retryWrites=true&w=majority&appName=Cluster0";

    console.log('🔌 Connecting to old database...');
    const oldConn = await mongoose.createConnection(oldURI);
    console.log('✅ Connected to old database');

    // Get all data
    const owners = await oldConn.db.collection('owners').find({}).toArray();
    const students = await oldConn.db.collection('students').find({}).toArray();
    const classes = await oldConn.db.collection('classes').find({}).toArray();
    const reviews = await oldConn.db.collection('reviews').find({}).toArray();

    console.log(`📊 Found data:`);
    console.log(`   - Owners: ${owners.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Classes: ${classes.length}`);
    console.log(`   - Reviews: ${reviews.length}`);

    await oldConn.close();

    // Connect to new database (clean name)
    const newURI =
      'mongodb+srv://taskinmubassir_db_user:ptR72Kx2QVc1wvaX@cluster0.expaq2d.mongodb.net/tanjim_pathshala?retryWrites=true&w=majority&appName=Cluster0';

    console.log('\n🔌 Connecting to new database...');
    const newConn = await mongoose.createConnection(newURI);
    console.log('✅ Connected to new database');

    // Insert data if exists
    if (owners.length > 0) {
      await newConn.db.collection('owners').insertMany(owners);
      console.log('✅ Owners migrated');
    }
    if (students.length > 0) {
      await newConn.db.collection('students').insertMany(students);
      console.log('✅ Students migrated');
    }
    if (classes.length > 0) {
      await newConn.db.collection('classes').insertMany(classes);
      console.log('✅ Classes migrated');
    }
    if (reviews.length > 0) {
      await newConn.db.collection('reviews').insertMany(reviews);
      console.log('✅ Reviews migrated');
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📝 Update your .env MONGODB_URI to:');
    console.log(newURI);

    await newConn.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
};

migrateToCleanDB();
