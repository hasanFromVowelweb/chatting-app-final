import mongoose from "mongoose";

const privateRoomSchema = new mongoose.Schema({
  roomID: {
    type: String,
    unique: true,
    required: true,
  },
  users: [{
    type: String,
    required: true,
  }],
  lastMsg: {
      type: String,
      required: true,
    }
});

privateRoomSchema.statics.findExistingPrivateRoom = async function (userName, recipientName) {
  try {
    const room = await this.findOne({
      users: { $all: [userName, recipientName] },
    });
    console.log('room from privateRoomSchema', room)
    return room ? room.roomID : null;
  } catch (err) {
    console.error('Error finding existing private room:', err);
    return null;
  }
};

export default mongoose.model('PrivateRoom', privateRoomSchema);

