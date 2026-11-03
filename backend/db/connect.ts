import mongoose from 'mongoose';

let connectionPromise: Promise<void> | null = null;

const connectDB = async (): Promise<void> => {
  const connUri = process.env.MONGODB_URI;
  if (!connUri) {
    throw new Error('MONGODB_URI is missing from environment variables.');
  }

  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(connUri, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log('MongoDB connected successfully: ' + conn.connection.host);
      })
      .catch((error: unknown) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
};

export default connectDB;
