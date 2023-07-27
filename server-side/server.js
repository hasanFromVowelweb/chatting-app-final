import express from 'express'
import connect_mongodb from './model/connect_mongodb.js'
import MessageContent from './model/messageSchema.js'
import mongoose from 'mongoose'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'
import Message from './model/messageSchema.js'
import PrivateRoom from './model/privateRoomSchema.js'
import multer from 'multer';
import path from 'path';
import PublicRoom from './model/publicRoomSchema.js'
import User from './model/userSchema.js'

//////////////////////////////////////////////////////////////////////////////////////////////

const app = express()

const httpServer = createServer(app);


const port = process.env.PORT || 32000

connect_mongodb()


const db = mongoose.connection;

// db.on('error', (err) => {
//     console.error('MongoDB connection error:', err);
// });

// // When the connection is established
// db.once('open', () => {
//     console.log('Connected to MongoDB successfully!');
//     listCollections();
// });

//   async function listCollections() {
//     try {
//       const collections = await mongoose.connection.db.listCollections().toArray();

//       // Print the list of collection names
//       console.log('Collections in the database:');
//       collections.forEach((collection) => {
//         console.log(collection.name);
//       });
//     } catch (err) {
//       console.error('Error listing collections:', err);
//     } finally {
//       // Close the Mongoose connection when done
//       mongoose.connection.close();
//     }
//   }


const users = new Map()

const rooms = new Map();

const privateRooms = new Map();

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173"
    },
});


const __filename = path.basename(import.meta.url);
const __dirname = path.resolve(path.dirname(__filename));

// Serve the static files (if needed) from a directory
app.use(express.static(path.join(__dirname, 'uploads')));

////////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////media upload//////////////////////////////////////

const storage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Serve the React build (if you prefer to serve the React app from the same server)
//   app.use(express.static(path.join(__dirname, 'client/build')));

// File upload endpoint
app.post('/upload', cors(), upload.single('file'), (req, res) => {
    // console.log('req.file', req.file)
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file received' });
    }

    // You may want to store the file details in a database or do further processing here
    return res.json({ filename: file.filename, path: file.path });
});

//////////////////////////////////////media download/////////////////////////////////////

app.get('/download', cors(), (req, res) => {
    const { filename } = req.query;

    if (!filename) {
        return res.status(400).json({ error: 'Missing filename in query parameters' });
    }

    const filePath = path.join(__dirname, 'uploads', filename);
    // console.log('filepath:', filePath);

    res.sendFile(filePath);
});

////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////// generate random room  ID ////////////////////////////////

function generateRoomID() {
    const length = 8;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let roomID = '';
    for (let i = 0; i < length; i++) {
        roomID += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return roomID;
}
//////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////// private room handlers ////////////////////////////////

async function findExistingPrivateRoom(userName, recipientName) {
    const roomID = await PrivateRoom.findExistingPrivateRoom(userName, recipientName);
    // console.log("roomID of findExistingPrivateRoom", roomID)
    return roomID;
}



async function createPrivateRoom(roomID, users, lastMsg) {
    // console.log('hittttttt createPrivateRoom roomID: ',roomID, 'users: ',users )
    try {
        const privateRoom = new PrivateRoom({ roomID, users, lastMsg });
        await privateRoom.save()
        // console.log('Private room saved successfully');

    } catch (error) {
        console.error('Error saving private room:', error);
    }

}

///////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////socket operations//////////////////////////////////////
io.on("connection", (socket) => {

    socket.on('new-user-online', async ({ userName, userEmail }) => {
        // console.log('new-user.....', userName);
        users[socket.id] = userName;
        // console.log('users[socket.id]', users[socket.id])
        // console.log('users.........', users)

        try {
            const allUsers = await User.find();
            // console.log(allUsers);
            io.emit('allUsers', allUsers);
            if (allUsers.some((user) => user.userEmail === userEmail)) {
                // console.log("hitttttttttttttttttttttttttttt''''''''';;;;;;;;")
                // console.log('exists userEmail', userEmail)
            } else {
                // console.log('dont exist hence created', userEmail)
                const newUser = new User({
                    userName: userName,
                    userEmail: userEmail,
                });

                newUser.save()
                    .then(async (user) => {
                        // console.log('New user created:', user);
                    })
                    .catch((err) => {
                        console.error('Error creating new user:', err);
                    });
            }

        } catch (error) {
            console.error('Error fetching all users:', error);
        }



        try {
            // Query messages for the specified room
            const messages = await Message.find();

            // Return the messages
            messages && io.emit('allChats', messages)
        } catch (err) {
            console.error('Error fetching messages:', err);
            return [];
        }
        socket.broadcast.emit('user-online', userName);
    });

    socket.on('joinRoom', async (roomId) => {
        socket.join(roomId.toString());
        rooms.set(socket.id, roomId.toString());
        socket.emit('roomJoined', roomId);
        console.log('roomID.....', roomId);

        ///////////////////retreiving previous messages/////////////////////

        try {
            const messages = await Message.find({ roomId });
            // console.log('messages..............', messages);
            // Return the messages
            messages && io.to(roomId).emit('prevChatfound', messages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }

        ////////////////////////////////////////////////////////////////////

        socket.to(roomId).emit('userJoinedRoom', { roomId, userId: socket.id });
    });

    socket.on('addToGroup', async ({ memberName, roomID }) => {
        console.log('memberName: ', memberName, 'roomID: ', roomID)
        try {
            const result = await PublicRoom.updateOne(
                {
                    roomID,
                    members: { $not: { $elemMatch: { $eq: memberName } } },
                },
                { $addToSet: { members: memberName } }
            );

            if (result.nModified === 0) {
                console.log('Document not found or no changes made.');
            } else {
                console.log('Document updated successfully.');
                console.log('users from add to group: ', users)
                Object.entries(users).forEach(([key, value]) => {
                    if (value === memberName) {
                        // console.log('sendData matched...', socket.id);
                        // console.log('sendData users', users);
                        console.log('successfullyAdded key', key);
                        io.to(key).emit('successfullyAdded');
                        // socket.broadcast.to(senderId).emit('successfullysend', 'for your eyes only');
                    }
                });
            }
        } catch (error) {
            console.error('Error updating document:', error);
        }
    })


    socket.on('leaveRoom', async (roomId) => {
        try {
            socket.leave(roomId.toString()); // Remove the user from the specified room
            rooms.delete(socket.id.toString()); // Remove the room from the rooms map for the user

            // Broadcast the event to the room that the user has left
            socket.to(roomId).emit('userLeftRoom', { roomId, name: getUserNameFromSocket(socket) });
        } catch (err) {
            console.error('Error leaving room:', err);
        }
    });



    var sendData = [];

    socket.on('success', data => {
        // console.log('successssssssssssssssssss data', data);
        sendData.push(data);
        // console.log('sendData', sendData);
        // console.log('users', users);

        setTimeout(processSendData, 500);
    });

    // Process the messages
    function processSendData() {
        // console.log('hey its running!!')
        if (sendData.length > 0) {
            // console.log('data....', sendData)
            Object.entries(users).forEach(([key, value]) => {
                if (value === sendData[0].sender) {
                    // console.log('sendData matched...', socket.id);
                    // console.log('sendData users', users);
                    // console.log('sendData key', key);
                    io.to(key).emit('successfullysend', { message: sendData[0], name: users[socket.id] });
                    // socket.broadcast.to(senderId).emit('successfullysend', 'for your eyes only');
                }
            });
            // Process the next message after a short delay (if needed)
            // setTimeout(processSendData, 1000);
        }
        // sendData.splice(0, sendData.length);

    }



    socket.on('createRoomPrivate', async (data) => {
        const { userName, recipientName, lastMsg } = data;
        // console.log('lastmsg:', lastMsg)

        try {
            // Check if the user is already in a private room with the recipient
            const existingRoom = await findExistingPrivateRoom(userName, recipientName);

            if (existingRoom) {
                // Skip room creation if a room already exists
                socket.emit('createdRoomPrivate', { privateRoomID: existingRoom, sender: userName, recipient: recipientName });
                return;
            }

            const privateRoomID = generateRoomID();
            const PrivateUsers = [userName, recipientName];
            await createPrivateRoom(privateRoomID, PrivateUsers, lastMsg);

            socket.join(privateRoomID.toString());
            socket.emit('createdRoomPrivate', { privateRoomID, sender: userName, recipient: recipientName });
            //   console.log('privateRooms....', privateRooms);
        } catch (error) {
            console.error('Error creating private room:', error);
            // Handle the error here, e.g., emit an error event to the client
            socket.emit('error', { message: 'Error creating private room' });
        }
    });


    // ...




    socket.on('sendMessage', async (message) => {
        console.log('users before emit ..........', users)
        // socket.emit('successfullysend', { message, name: users[socket.id] });
        // console.log('users after emit ..........', users)

        console.log('message.....from send...', message);

        const roomId = rooms.get(socket.id);
        // io.emit('successfullysend', message);

        // socket.to(roomId).emit('successfullysend', { message});
        // socket.broadcast.to(roomId).emit('successfullysend', 'nice game');
        // io.in(roomId).emit('successfullysend', 'cool game');
        // socket.to(roomId).emit('successfullysend', 'enjoy the game');


        // console.log('users[socket.id.. upper.....', users[socket.id])

        const options = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata' // Set the time zone to India (IST)
        };
        const timestamp = new Date().toLocaleTimeString('en-IN', options);
        // console.log('roomId before....', message?.roomID.toString())
        // io.emit('receive', { message, name: users[socket.id], time: timestamp, type: 'receive' });

        io.emit('receive', {
            chatId: message.chatId,
            roomId: message.roomID,
            sender: message.sender,
            content: message.message,
            timestamp,
            file: message.file,
            deleteForEveryOne: false,
            status: 'delivered',
        });

        // console.log('roomId after....', message.roomID)
        // console.log('rooms..', rooms)
        // console.log('{ message, name: users[socket.id], time: timestamp, type: receive }', { message, name: users[socket.id], time: timestamp, type: 'receive' })
        /////////////////////////storing messages in database//////////////////////////////

        try {
            // Create a new message document
            const newMessage = new Message({
                chatId: message.chatId,
                roomId: message.roomID,
                sender: message.sender,
                content: message.message,
                timestamp,
                file: message.file,
                deleteForEveryOne: false,
                status: 'delivered',
            });

            // console.log("{roomId: message.roomID,sender: message.sender,file, content: message.message,timestamp}", {
            //     chatId: message.chatId,
            //     roomId: message.roomID,
            //     sender: message.sender,
            //     content: message.message,
            //     timestamp,
            //     file: message.file,
            //     status: 'delivered',

            // })
            // Save the message to the database
            await newMessage.save();

        } catch (err) {
            console.error('Error saving message:', err);
        }
        // console.log('users after emit ..........', users)








        /////////////////////////////////////////////////////////////////////////////
        // socket.emit('successfullysend', { message, name: users[socket.id] });


        // let senderId;
        // console.log('message.sender........', socket.id);
        // Object.entries(users).forEach(([key, value]) => {
        //     console.log('hit on forEach statement!!');
        //     console.log('users', users)
        //     console.log('users[socket.id]', users[socket.id])
        //     console.log('socket.id', socket.id)
        //     if (key === socket.id) {
        //         console.log('sender matched...', socket.id);
        //         senderId = key;
        //         console.log('roomId.......', roomId);
        //         io.to(senderId).emit('successfullysend', { message, name: users[socket.id] });
        //         // socket.broadcast.to(senderId).emit('successfullysend', 'for your eyes only');
        //         console.log('users.senderId,,,', users.senderId);
        //         console.log('users[socket.id]......', users[socket.id])
        //         console.log('socket.id.....', socket.id)
        //         console.log('senderId.......', senderId)
        //     }
        // });
    });

    // socket.on('sendMessage', (message) => {
    //     const roomId = rooms.get(socket.id);
    //     const senderName = users[socket.id];

    //     const options = {
    //       hour: 'numeric',
    //       minute: '2-digit',
    //       hour12: false,
    //       timeZone: 'Asia/Kolkata', // Set the time zone to India (IST)
    //     };
    //     const timestamp = new Date().toLocaleTimeString('en-IN', options);

    //     // Emit 'receive' event to all clients in the room, including the sender
    //     io.to(roomId).emit('receive', {
    //       message,
    //       name: senderName,
    //       time: timestamp,
    //       type: 'receive',
    //     });

    //     // Emit 'successfullysend' event back to the sender

    //     socket.emit('successfullysend', {
    //       message,
    //       name: senderName,
    //     });
    //   });



    // socket.on('success', data => {
    //     console.log('data...on succeed...', data)
    //     console.log('data...on succeed.name..', data.message.sender)
    //     console.log('message.sender........', data.message.sender)
    //     Object.entries(users).forEach(([key, value]) => {
    //         console.log('hit on forEach statement!!')
    //         // console.log('Key:', key, 'Value:', value);
    //         if (value.includes(data.message.sender)) {

    //             console.log('sender matched...', data.message.sender)
    //             console.log('sender matched id...', key)
    //             io.to(key).emit('successfullysend', {data, name: users[socket.id]});
    //             console.log('hit inside forEach statement!! key :', key)


    //         }
    //     })
    // })


    socket.on('chatDelete', async message => {
        console.log('message for delete:', message)

        if (message.type === 'delete') {
            console.log("deleteFromBoth''''''''roomID: ", message.roomID, 'type: ', message.type, 'message:', message.message)
            try {
                const result = await Message.updateOne(
                    {
                        chatId: message.message.chatId,
                        deleteFrom: { $not: { $elemMatch: { $eq: message.userName } } },
                    },
                    { $addToSet: { deleteFrom: message.userName } }
                );

                if (result.nModified === 0) {
                    console.log('Document not found or no changes made.');
                } else {
                    console.log('Document updated successfully.');
                }
            } catch (error) {
                console.error('Error updating document:', error);
            }


        } else if (message.type === 'deleteFromBoth') {

            // console.log("deleteFromBoth''''''''roomID: ", message.roomID, 'type: ', message.type, 'message:', message.message)
            io.emit('deleteForEveryone', message)
            try {
                await Message.updateOne({ chatId: message.message.chatId }, { $set: { deleteForEveryOne: true } })
                    .then((result) => {
                        if (result.nModified == 0) {
                            console.log('Document not found or no changes made!')
                        } else {
                            console.log('Document updated successfully')
                        }
                    })
                    .catch((error) => {
                        console.log('Error occured while updating!', error)
                    })
            } catch (error) {
                console.error('error occured while updating!', error)
            }
        }

    })


    socket.on('disconnect', () => {

        const roomId = rooms.get(socket.id);
        // console.log('users[socket.id]', users[socket.id])
        // console.log('socket.id........', socket.id)
        // console.log('roomId......', roomId)
        if (roomId) {
            socket.to(roomId).emit('userLeftRoom', { name: users[socket.id], roomId, userId: socket.id });
            socket.leave(roomId);
            rooms.delete(socket.id);
            // console.log('disconnected id', socket.id)
        } else {
            // console.log('')
        }
        // console.log('new-user .....', users[socket.id]);
        delete users[socket.id];
    });
});


///////////////////////////////////////////////////////////////////////////////////////////////



// let recipientId = ''
// console.log('privateRoomID....', privateRoomID)
// console.log('privateRooms....', privateRooms)
//     Object.entries(privateRooms).forEach(([key, value]) => {
//         // console.log('Key:', key, 'Value:', value);
//         if (value.includes(privateRoomID)) {
//             console.log('recepientName matched...', recipientName)
//             recipientId = key
//             socket.to(recipientId).emit('joinedRoomPrivate', { privateRoomID, sender: userName, recipient: recipientName });

//         }
//         else {
//             console.log('recepientName not matched...', recipientName)
//             // socket.to(roomId).emit('receive', { error: 'user is not register or login' });
//         }
//     });

////////////////////////////////////////////////////////////////////////////////

// for (const [id, names] of privateRooms.entries()) {
//     if (id === privateRoomID) {
//       console.log('Match found!');
//       console.log('ID:', id);
//       console.log('Names:', names);

//       socket.to(id[recipientName]).emit('joinedRoomPrivate', { privateRoomID, sender: userName, recipient: recipientName });              
//       console.log({ privateRoomID, sender: userName, recipient: recipientName })

//       break; // Exit the loop if a match is found

//     }
//   }

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////--------------remaining routes handlers-------------////////////////////////////////////////////

app.use(cors())
app.use(express.json())

app.post('/createGroup', async (req, res) => {
    const { groupName, createdBy } = req.body;

    console.log('messagesGet..............groupName: ', groupName, 'createdBy', createdBy);

    try {
        const createGroop = new PublicRoom({
            roomID: generateRoomID(),
            members: [createdBy],
            lastMsg: 'this is the last message',
            groupName,
            createdBy
        })
        await createGroop.save()
    } catch (error) {
        console.error('error occured while saving group creation data')
    }

});


app.get('/getGroup', async (req, res) => {

    try {
        const getGroup = await PublicRoom.find()

        // console.log('getGroup', getGroup)
        res.status(200).json(getGroup)

    } catch (error) {
        console.error('error occured while getting group data')
    }

});


app.delete('/deleteGroup/:id', async (req, res) => {

    try {
        const roomID = req.params.id;
        console.log('roomid for delete group!', roomID)
        // Use Mongoose's 'findByIdAndDelete' method to delete the document
        const deletedGroup = await PublicRoom.findOneAndDelete({roomID});
        
        if (deletedGroup) {
          // Document found and deleted successfully
          res.status(200).json({ message: 'Group deleted successfully.' });
        } else {
          // Document with the specified ID not found
          res.status(404).json({ message: 'Group not found.' });
        }
      } catch (error) {
        // Error occurred while deleting
        res.status(500).json({ message: 'Error deleting group.', error: error.message });
      }

});


app.get('/getPrivate', async (req, res) => {

    try {

        const getPrivate = await PrivateRoom.find()

        // console.log('getPrivate', getPrivate)
        res.status(200).json(getPrivate)

    } catch (error) {
        console.error('error occured while getting private data')
    }

});


///////////////////////////////////////////////////////////////////////////




// const recipients = new Set();

// io.on('connection', (socket) => {
//   socket.on('joinRoom', (roomId) => {
//     socket.join(roomId);
//     recipients.add(socket.id); 
//     // ...
//   });

//   console.log('recipients.......', recipients)

//   socket.on('leaveRoom', (roomId) => {
//     socket.leave(roomId);
//     recipients.delete(socket.id); 
//     // ...
//   });

//   socket.on('send', (message) => {
//     const roomId = rooms.get(socket.id);
//     const timestamp = new Date().toUTCString();
//     const recipientName = message.recipientName;

//     if (recipientName && recipients.has(recipientName)) {
//       io.to(recipientName).emit('receive', {
//         message,
//         name: users[socket.id],
//         time: timestamp,
//         userId: recipientName,
//       });
//     } else {
//       socket.to(roomId).emit('receive', {
//         message,
//         name: users[socket.id],
//         time: timestamp,
//       });
//     }
//   });

//   socket.on('disconnect', () => {
//     const roomId = rooms.get(socket.id);
//     if (roomId) {
//       socket.to(roomId).emit('userLeftRoom', {
//         name: users[socket.id],
//         roomId,
//         userId: socket.id,
//       });
//       socket.leave(roomId);
//       rooms.delete(socket.id);
//       recipients.delete(socket.id); 
//     }
//     delete users[socket.id];

//   });
// });




app.get('/', (req, res) => {
    res.status(200).send('hello')
})



// app.get('/messages/sync', cors(), async (req, res) => {

//     try {

//         await Message.find()
//             .then((data) => {

//                 console.log('successfully message get!')
//                 // console.log(data)

//                 res.status(200).json(data)
//             })
//             .catch((error) => {
//                 console.log('error getting messages!', error)
//                 res.status(500).send(error)
//             })

//     }
//     catch (error) {
//         console.log('error performing messages operation on server:', error)
//     }


// })




// app.post('/api/v1/messages/new', async (req, res) => {
//     const messagesGet = req.body

//     console.log('messagesGet..............', messagesGet)



//     try {

//         await MessageContent.create(messagesGet)
//             .then(() => {

//                 console.log('successfully message created!')

//                 res.status(200).send('successfully saved messages!')
//             })
//             .catch((error) => {

//                 console.log('error creating messages!', error)
//                 res.status(500).send(error)
//             })



//     }
//     catch (error) {
//         console.log('error performing messages operation on server:', error)
//     }


// })


httpServer.listen(port, () => {
    console.log(`server is listening on port ${port} ...`)
})