import mongoose from "mongoose";

const publicRoomSchema = new mongoose.Schema({
  roomID: {
    type: String,
    unique: true,
    required: true,
  },
  members: [{
    type: String,
    required: true,
  }],
  lastMsg: {
    type: String,
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
});

// publicRoomSchema.statics.findExistingPrivateRoom = async function (userName, recipientName) {
//   try {
//     const room = await this.findOne({
//       users: { $all: [userName, recipientName] },
//     });
//     console.log('room from publicRoomSchema', room)
//     return room ? room.roomID : null;
//   } catch (err) {
//     console.error('Error finding existing private room:', err);
//     return null;
//   }
// };

export default mongoose.model('PublicRoom', publicRoomSchema);

