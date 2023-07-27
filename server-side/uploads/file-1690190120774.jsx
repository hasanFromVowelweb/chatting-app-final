import React, { useState, useEffect, useCallback, useContext, useRef } from 'react'
import '../assets/chat.css'
import { Avatar, IconButton, Input } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import MicIcon from '@mui/icons-material/Mic';
import io from 'socket.io-client';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DataContext from '../DataContext';
import DoneIcon from '@mui/icons-material/Done';
import DoDisturbAltIcon from '@mui/icons-material/DoDisturbAlt';
import axios from 'axios';


export default function Chat({ setChatIconClicked, userName, ischatIconClicked, roomID, chatName, }) {
  const { emptyChat, privateChatData, setPrivateChatData, setPrivateNewMsgRec, setPrivateNewMsg } = useContext(DataContext);

  const form = document.getElementById('send-container')
  const messageInput = document.getElementById('message-input')
  const chatHeaderInfo = document.querySelector('.chat_headerInfo')
  const messageContainer = document.querySelector('.message-container');
  const [recipientsActive, setRecipientsActive] = useState()
  const [state, setState] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('');
  const [prevChats, setPrevChats] = useState([])
  const [chatState, setChatState] = useState(true)
  const messageContainerRef = useRef(null);


  /////////////////////emoji picker////////////////////////////
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState(null);


  useEffect(() => {
    // Scroll to the bottom once the messages have been rendered or whenever they change
    messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
  }, [prevChats]);

  const [privateChatInit,
    setPrivateChatInit] = useState({
      userName: userName,
      recipientName: ''
    })



  var audio = new Audio('ting.mp3');

  // const socket = io('http://localhost:45000')
  const socketRef = useRef();


  const someOnesOnline = (message) => {
    const messageElement = document.createElement('code');
    messageElement.innerText = message && message;
    // chatHeaderInfo.append(messageElement)
    // setTimeout(() => {
    //   chatHeaderInfo.removeChild(messageElement)
    // }, 500)
  }

  const someOnesOffline = (message) => {
    const messageElement = document.createElement('code');
    messageElement.innerText = message && message;
    // chatHeaderInfo.append(messageElement)
    // setTimeout(() => {
    //   chatHeaderInfo.removeChild(messageElement)
    // }, 500)
  }


  useEffect(() => {

    // socket.connect()
    const socket = io.connect('http://localhost:45000');

    socketRef.current = socket;

    socket.emit('new-user-online', userName);

    socket.emit('joinRoom', roomID);


    socket.on('user-online', name => {
      someOnesOnline(`${name} is online!`)

      ///////////////store uers in array to identify////////////////

      if (!recipientsActive?.includes(name)) {
        setRecipientsActive((prevUsers) => {
          if (Array.isArray(prevUsers)) {
            return [...prevUsers, name];
          } else {
            return [name];
          }
        });
      }
    })

    socket.on('userJoinedRoom', data => {
      console.log('user joined the room......', data)
    })



    socket.on('receive', data => {
      console.log('dataReceived........: ', data)
      console.log('hiitttt received.........')
      setMessages((prevMessages) => [...prevMessages, data]);
      socket.emit('success', data)
      // setMessages((prev) =>
      //   prev.map((message) => {
      //     if (data.id === message.id) {
      //       console.log('data for status: ', message);
      //       return {
      //         ...message,
      //         status: 'delivered'
      //       };
      //       return data
      //     }
      //     return message;
      //   })
      // );


    })

    ///////////////////////////////////////////////////////
    socket.on('createdRoomPrivate', (data) => {
      console.log('createdRoomPrivate....', data)
      setPrivateNewMsg((prev) => {
        if (prev.some((item) => item.privateRoomID === data.privateRoomID)) {
          return prev; // Skip adding the data if it already exists in the array
        }
        return [...prev, data]; // Add the new data object to the array
      });

      // Perform actions for the user who requested to create the room
    });





    socket.on('joinedRoomPrivate', (data) => {
      console.log('Joined room with ID.......:', data);
      console.log('joinedRoomPrivate data..', data)
      setPrivateNewMsgRec((prev) => {
        if (prev.some((item) => item.privateRoomID === data.privateRoomID)) {
          return prev; // Skip adding the data if it already exists in the array
        }
        return [...prev, data]; // Add the new data object to the array
      });
      // Perform actions for the other user who joined the room
    });




    socket.on('prevChatfound', data => {
      // console.log('prevchatfound...', prevChats)
      setPrevChats(data);
    });



    socket.on('userLeftRoom', name => {
      console.log('user left the room.........', name)
      someOnesOffline(`${name.name} is offline!`)

    })



    socket.on('deleteForEveryone', message => {
      console.log('deleteForEveryone.....', message)
      console.log('messages....', messages)
      setMessages((prev) =>
        prev.map((data) => {
          if (data.message.id === message.message.id) {
            console.log('data matched deleteForEveryone: ', data);
            console.log("edit data", message)
            return {
              ...data,
              message: {
                ...data.message,
                message: "This message was deleted",
              },
              name: null,
            };
          }
          return data;
        })
      );
    })

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);

    });

    return () => {
      socket.off('user-online')
      socket.off('userJoinedRoom')
      socket.off('userJoinedRoom')
      socket.off('receive')
      socket.off('createdRoomPrivate')
      socket.off('joinedRoomPrivate')
      socket.off('prevChatfound')
      socket.off('userLeftRoom')
      socket.off('deleteForEveryone')
      socket.off('disconnect')

      socket.disconnect();

    };
  }, [roomID,someOnesOnline, setRecipientsActive, recipientsActive, setMessages, setPrivateNewMsg, setPrevChats]);


  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await axios.get('http://localhost:45000/messages/sync'); // Replace with your API endpoint URL
  //       const data = response.data;
  //       console.log('Data:', data);
  //       setPrevChats(data);
  //       // Process the data or update state with the received data
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //       // Handle the error here
  //     }
  //   };

  //   // Call the fetchData function to make the GET request
  //   fetchData();

  // }, []);


  useEffect(() => {
    state && socketRef.current.emit('createRoomPrivate', { userName, recipientName: privateChatInit?.recipientName })


    if (ischatIconClicked) {
      // console.log('ischatIconClicked......', ischatIconClicked)
      const name = prompt(`Enter a recipient names from active recipients: ${recipientsActive}`);
      const recipientName = name && name.trim(); // Trim whitespace from the entered ID

      if (recipientsActive?.includes(recipientName)) {
        setPrivateChatInit((prev) => {
          return { ...prev, recipientName: recipientName };
        });

        setState(true)

        setTimeout(() => {
          setState(false)
        }, 2000)

      }

      else {
        alert('Recipient name not found!')

      }
      setChatIconClicked(false)


    } else {
      setChatIconClicked(false)
    }

  }, [socketRef, ischatIconClicked, recipientsActive, setChatIconClicked])




  useEffect(() => {
    socketRef.current.on('successfullysend', data => {
      console.log('message sent successfully//////////////////////////////////.........', data)
      setMessages((prev) =>
        prev.map((message) => {
          // console.log('id for status data.message.id: ', data.message.message.id);
          // console.log('id for status message.id: ', message.id);
          if (data.message.message.id === message.id) {
            console.log('data for status: ', message);
            return {
              ...message,
              status: 'delivered'
            };
          }
          return message;
        })
      );
    })
  }, [socketRef])

  var randomId;

  function generateRoomID() {
    if (!randomId) {
      const min = 1000000000;
      const max = 9999999999;
      const randomID = Math.floor(Math.random() * (max - min + 1)) + min;
      const ID = randomID.toString();
      randomId = ID;
    }
    return randomId;
  }

  const handleInputChange = useCallback((e) => {
    e.preventDefault()
    setInputValue(e.target.value);
    console.log('inputValue', inputValue)
  }, [setInputValue, inputValue])


  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const message = messageInput.value
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata' // Set the time zone to India (IST)
    };
    // console.log('message.........', message)
    const timestamp = new Date().toLocaleTimeString('en-IN', options);

    const currentRoomId = generateRoomID(); // Use the existing roomId or generate a new one

    // console.log('roomID from handleSubmit.....', roomID);
    setMessages((prevMessages) => [
      ...prevMessages,
      { message, name: 'You', time: timestamp, type: 'send', id: currentRoomId, status: 'sent' },
    ]);

    socketRef.current.emit('sendMessage', { roomID, sender: userName, message, id: currentRoomId });
    messageInput.value = ''
    // console.log('prevChats', prevChats)
    setChatState(prev => !prev)

  }, [setMessages, socketRef, setPrevChats, prevChats, generateRoomID, inputValue, setInputValue]);


  // useEffect(() => {
  //   if (roomID) {
  //     socketRef.current.emit('joinRoom', roomID);
  //   }

  // }, [socketRef, roomID]);

  useEffect(() => {
    
    if (messageContainer && roomID) {
      messageContainer.innerHTML = '';
    }
  }, [roomID, messageContainer]);


  ///////////////file attachment/////////////////////////
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    // console.log('file', file)

    // Emit a Socket.IO event to send the file
    // socket.emit('sendFile', file);
  };


  ////////////////////////emoji picker///////////////////////

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prevState) => !prevState);
  };

  const handleEmojiSelect = (emoji) => {
    setSelectedEmoji(emoji.event);
    console.log('selectedEmoji', selectedEmoji)
  };

  useEffect(() => {
    // console.log('messages', messages)
    // console.log('userName.....', userName)
    // console.log('roomId....', roomID)
  }, [userName, roomID, ])


  //////////////////////// more option chat////////////////////////////////

  function handleDelete(type, data) {
    // console.log('data...', type, data);

    if (type === 'delete') {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message !== data)
      );
    } else if (type === 'deleteFromBoth') {
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id === data.id) {
            // console.log('data for deleteFromBoth: ', message);
            socketRef.current.emit('deleteFromBoth', { message, roomID })
            return {
              ...message,
              message: "You deleted this message",
              name: null,
            };
          }
          return message;
        })
      );
    }
  }

  /////////////////////////////////////////////////////

  return (
    <div className='chat'>
      <div className="chat_header">
        <IconButton>
          <Avatar />
        </IconButton>
        <div className="chat_headerInfo">
          <h3>{chatName}</h3>
          <p>Last seen at....</p>
        </div>
        <div className="chat_headerRight">
          <IconButton>
            <SearchIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </div>
      </div>

      <div ref={messageContainerRef}  className="message-container chat_body">

        {/* ///////////////////////recieved message/////////////// */}


        {/* <p className=' chat_message'>
          <span className='chat_name'>Randy</span>
          <span className='chat'>Hey, There!</span>
          <span className='chat_timestamp'>
            {new Date().toUTCString()}
          </span>
        </p> */}


        {/* //////////////////////////send message////////////////////////// */}

        {/* <p className='chat_message chat_receiver'>
          <span className='chat_name'>Brock</span>
          <span className='chat'>Hey,</span>
          <span className='chat_timestamp'>
            {new Date().toUTCString()}
          </span>
          <span className='tick'>
            <DoneAllIcon />
          </span>
        </p>
       */}


        {Array.isArray(prevChats) && prevChats.map((data, index) => {
          // console.log('data map:', data?.sender);
          if (data?.roomId?.includes(roomID)) {
            return (<>
              <p key={index + 1} className={data?.sender === userName ? "chat_message chat_receiver" : "chat_message"}>
                <span className="chat_name">{data?.sender === userName ? "You" : data?.sender}</span>
                <span className='chatMore'><IconButton data-bs-toggle="dropdown" aria-expanded="false"><ExpandMoreIcon /></IconButton>
                  <ul class="dropdown-menu">
                    <li><IconButton class="dropdown-item" onClick={() => handleDelete('delete', data)}>Delete</IconButton></li>
                    {data?.sender === userName && <li><IconButton class="dropdown-item" onClick={() => handleDelete('deleteFromBoth', data)} >Delete For EveryOne</IconButton></li>}
                  </ul>
                </span>
                <span style={{ display: 'inline' }} className={data?.sender == null ? "chat chat-deleted" : "chat"}>{
                  data?.send !== userName ? (
                    data?.sender == null ? (
                      <>
                        <DoDisturbAltIcon /> {data?.content}

                      </>
                    ) : (
                      data?.content
                    )
                  ) : (
                    data?.sender == null ? (
                      <>
                        <DoDisturbAltIcon /> {data?.content}
                      </>
                    ) : (
                      data?.content
                    )
                  )
                }</span>
                <span className="chat_timestamp">{data?.timestamp}</span>
                {data?.sender === userName && data?.sender !== null && (
                  <span className="tick">
                    <DoneAllIcon />
                  </span>
                )}
              </p>
            </>
            );
          }

        })}




        {Array.isArray(messages) && messages.map((data, index) => {
          // console.log('data map:', data?.name);
          messageContainer.scrollTop = messageContainer.scrollHeight;
          return (<>
            <p key={index + 1} className={data?.type === 'send' ? "chat_message chat_receiver" : "chat_message"}>
              <span className="chat_name">{data?.name}</span>
              <span className='chatMore'><IconButton data-bs-toggle="dropdown" aria-expanded="false"><ExpandMoreIcon /></IconButton>
                <ul class="dropdown-menu">
                  <li><IconButton class="dropdown-item" onClick={() => handleDelete('delete', data)}>Delete</IconButton></li>
                  {data?.type === 'send' && <li><IconButton class="dropdown-item" onClick={() => handleDelete('deleteFromBoth', data)} >Delete For EveryOne</IconButton></li>}
                </ul>
              </span>
              <span style={{ display: 'inline' }} className={data?.name == null ? "chat chat-deleted" : "chat"}>{
                data?.type === 'receive' ? (
                  data?.name == null ? (
                    <>
                      <DoDisturbAltIcon /> {data?.message?.message}

                    </>
                  ) : (
                    data?.message?.message
                  )
                ) : (
                  data?.name == null ? (
                    <>
                      <DoDisturbAltIcon /> {data?.message}
                    </>
                  ) : (
                    data?.message
                  )
                )
              }</span>
              <span className="chat_timestamp">{data?.time}</span>
              {data?.type === 'send' && data?.name !== null && (
                <span className="tick">
                  {data?.status === 'sent' ? (
                    <DoneIcon />
                  ) : data?.status === 'delivered' ? (
                    <DoneAllIcon />
                  ) : null}
                </span>
              )}
            </p>
          </>
          );
        })}

        {/* <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Dropdown button
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Action</a></li>
            <li><a class="dropdown-item" href="#">Another action</a></li>
            <li><a class="dropdown-item" href="#">Something else here</a></li>
          </ul>
        </div> */}
      </div>


      <div className="chat_footer">
        <IconButton onClick={toggleEmojiPicker}>
          <InsertEmoticonIcon />
        </IconButton>

        {showEmojiPicker && (
          //   <Picker data={data} onSelect={handleEmojiSelect} showPreview={false} style={{ position: 'absolute', bottom: '80px', right: '16px' }} />
          <div style={{ position: 'absolute', bottom: '80px', zIndex: '3', left: '30rem' }}><Picker data={data} onEmojiSelect={console.log} onSelect={handleEmojiSelect} /></div>
        )}
        <IconButton>
          <label style={{ cursor: 'pointer' }} htmlFor="file-input">
            <AttachFileIcon type='file' />
          </label>
        </IconButton>
        <form id='send-container' onSubmit={handleSubmit}>
          <input type="file" id="file-input" style={{ display: 'none' }} onChange={handleFileSelect} />
          <input type="text" id='message-input' placeholder='Type a message' />
        </form>
        <IconButton>
          <MicIcon />
        </IconButton>
      </div>
    </div>
  )
}
