import mongoose  from 'mongoose';

// Define the user schema
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  userEmail: {
    type: String,
    required: true,
    unique: true,
  },
});


export default mongoose.model('User', userSchema);

