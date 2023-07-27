import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true, },
  roomId: { type: String, required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  file: {type: Object, },
  deleteFrom: {type: Array},
  deleteForEveryOne: {type: Boolean},
  status: { type: String, required: true }
});

export default mongoose.model('Message', messageSchema)