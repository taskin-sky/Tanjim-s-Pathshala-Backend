import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.${process.env.DB_CLUSTER0}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
    );
    console.log(`✅ DB Connected - Name: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
