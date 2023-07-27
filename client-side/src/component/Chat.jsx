import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import '../assets/chat.css';
import { Avatar, IconButton, Input } from '@mui/material';
import { Search as SearchIcon, AttachFile as AttachFileIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { DoneAll as DoneAllIcon, InsertEmoticon as InsertEmoticonIcon, Mic as MicIcon, ExpandMore as ExpandMoreIcon, Done as DoneIcon, DoDisturbAlt as DoDisturbAltIcon, Close as CloseIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import io from 'socket.io-client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import DataContext from '../DataContext';
import axios from 'axios';


export default function Chat() {
  const { setRefreshSidebar, setAllUsers, allUsers, userEmail, setChatIconClicked, userName, ischatIconClicked, roomID, chatName, setOpenChat, privateChatData, setPrivateChatData, setPrivateNewMsgRec, setPrivateNewMsg } = useContext(DataContext);

  const messageInput = document.getElementById('message-input')
  const chatHeaderInfo = document.querySelector('.chat_headerInfo')
  const messageContainer = document.querySelector('.message-container');
  const [recipientsActive, setRecipientsActive] = useState()
  const [state, setState] = useState(false)
  const [inputValue, setInputValue] = useState('');
  const [prevChats, setPrevChats] = useState([])
  const [chatState, setChatState] = useState(true)
  const messageContainerRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [getFile, setGetFile] = useState(null)


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

  // useEffect(() => {

  //   axios.get('http://localhost:32000/messages/sync').then((response) => {
  //     // The response will contain the file information returned from the server
  //     console.log('prevchats data: ', response.data);
  //     setPrevChats(response?.data);

  //   });
  // }, [prevChats])


  var audio = new Audio('ting.mp3');

  const socketRef = useRef();


  const someOnesOnline = (message) => {
    const messageElement = document.createElement('code');
    messageElement.innerText = message && message;
    chatHeaderInfo?.append(messageElement)
    setTimeout(() => {
      chatHeaderInfo?.removeChild(messageElement)
    }, 500)
  }

  const someOnesOffline = (message) => {
    const messageElement = document.createElement('code');
    messageElement.innerText = message && message;
    chatHeaderInfo?.append(messageElement)
    setTimeout(() => {
      chatHeaderInfo?.removeChild(messageElement)
    }, 500)
  }
  ///////////////////////socket listeners/////////////////////////////

  useEffect(() => {

    // socket.connect()
    const socket = io.connect('http://localhost:32000');

    socketRef.current = socket;

    socket.emit('new-user-online', { userName, userEmail });

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
      if (roomID == data.roomId) {
        console.log('dataReceived........: ', data)
        console.log('hiitttt received.........')
        setPrevChats((prev) => {
          return [...prev, data]
        })
        console.log("prevChats from receive", prevChats)
        // Request notification permission when the application initializes
        requestNotificationPermission();

        // Show a notification
        showNotification('New Message', {
          body: `${data.sender}: ${data.content}.`,
          // icon: 'path/to/notification-icon.png',
        });


        // setPrevChats((prev) =>
        //   prev.map((message) => {
        //     console.log('id for status message.chatId: ', message.chatId);
        //     if (data.chatId === message.chatId) {
        //       console.log('data for status: ', message);
        //       return {
        //         ...message,
        //         status: 'delivered'
        //       };
        //     }
        //     return message;
        //   })
        // );

        socket.emit('success', data)
      }

    })

    socket.on('successfullyAdded', () => {
      console.log('successfullyAdded from client')
      setRefreshSidebar(prev => !prev)
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
      console.log('prevChatfound....', data)
      setPrevChats(data);
    });


    socket.on('userLeftRoom', name => {
      console.log('user left the room.........', name)
      someOnesOffline(`${name.name} is offline!`)

    })


    socket.on('successfullysend', data => {
      console.log('message sent successfully//////////////////////////////////.........', data)

      setPrevChats((prev) =>
        prev.map((message) => {
          // console.log('id for status message.chatId: ', message?.chatId);
          // console.log('data.message.chatId', data?.message?.chatId)
          // console.log('message.chatId', message?.chatId)
          if (data?.message?.chatId === message?.chatId) {
            // console.log('data matched for status: ', message);
            return {
              ...message,
              status: 'delivered'
            };
          }
          return message;
        })
      );

    })


    socket.on('deleteForEveryone', data => {
      if (data.roomID == roomID) {
        // console.log('deleteForEveryone.....', data.message.chatId)
        setPrevChats((prev) =>
          prev.map((message) => {
            if (data.message.chatId === message.chatId) {
              // console.log('data for deleteFromBoth: ', message);
              return {
                ...message,
                deleteForEveryOne: true
              };
            }
            return message;
          })
        );
      } else {
        null
      }

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
      socket.off('successfullysend')
      socket.off('disconnect')


      socket.disconnect();

    };
  }, [someOnesOnline, setRecipientsActive, recipientsActive, setPrivateNewMsg, setPrevChats]);



  // useEffect(()=>{
  //   setInterval(() => {
  //     console.log('roomid from client side', roomID)
  //     console.log('username from clietn side', userName)
  //   }, 20000);
  // })
  ///////////////////////////////////////////////////////////////////////

  ///////////////////////////socket all users data///////////////////////


  useEffect(() => {
    socketRef.current.on('allUsers', data => {
      // console.log('allUsers from client', data);
      setAllUsers(data)
    });

    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      socketRef.current.off('allUsers');
    };
  }, [socketRef]);

  ///////////////////////////////////////////////////////////////////////

  ///////////////////////////web notification////////////////////////////

  function requestNotificationPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      } else {
        console.warn('Notification permission denied.');
      }
    });
  }


  function showNotification(title, options) {
    if (!('Notification' in window)) {
      console.error('This browser does not support desktop notifications.');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      // Request permission again if it was not explicitly denied
      requestNotificationPermission();
    }
  }

  //////////////////////////////////////////////////////////////////////

  //////////////////////////////create one to one chat///////////////////////////////////


  useEffect(() => {
    state && socketRef.current.emit('createRoomPrivate', { userName, recipientName: privateChatInit?.recipientName, lastMsg: 'this is the last message' })


    if (ischatIconClicked) {
      // console.log('ischatIconClicked......', ischatIconClicked)
      const name = prompt(`Enter a recipient names from active recipients: ${recipientsActive}`);
      const recipientName = name && name.trim(); // Trim whitespace from the entered ID
      console.log('recipientName', recipientName)

      if (recipientsActive?.includes(recipientName)) {
        setPrivateChatInit((prev) => {
          return { ...prev, recipientName: recipientName };
        });

        setState(true)

        setTimeout(() => {
          setState(false)
        }, 2000)

      }

      else if (recipientName) {

        alert('Recipient name not found!')

      }
      setChatIconClicked(false)


    } else {
      setChatIconClicked(false)
    }

  }, [socketRef, ischatIconClicked, recipientsActive, setChatIconClicked])


  //////////////////////////////create group chat///////////////////////////
  function handleAddMembers() {
    const name = prompt('Enter a name of the member to add.')
    const memberName = name && name.trim();
    console.log('memberName:', memberName)
    console.log('allusers', allUsers);

    const hasUserName = allUsers.some(user => user.userName === memberName);

    if (hasUserName) {
      console.log('has name');
      alert(`${memberName} has successfully added to a ${chatName}!`)
      socketRef.current.emit('addToGroup', { memberName, roomID })

    } else {
      console.log('has not');
      alert(`sorry ${memberName} is not registered!`)
    }

  }






  //////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////

  /////////////////////////handlesubmit handleChange////////////////////////

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

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('getfile;;', getFile)
    const message = messageInput.value
    const options = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata' // Set the time zone to India (IST)
    };
    // console.log('message.........', message)
    const timestamp = new Date().toLocaleTimeString('en-IN', options);

    const chatId = generateRoomID(); // Use the existing roomId or generate a new one

    // console.log('roomID from handleSubmit.....', roomID);
    setPrevChats((prev) => {
      return [...prev, {
        chatId,
        roomId: roomID,
        sender: userName,
        content: message,
        timestamp,
        file: getFile,
        status: 'sent'
      }]
    })
    console.log('prevchars from sent:', prevChats)


    console.log("{roomId: roomID, sender: userName, content: message,fileselected,timestamp, status}", {
      chatId,
      roomId: roomID,
      sender: userName,
      content: message,
      timestamp,
      file: getFile,
      status: 'sent'
    })

    socketRef.current.emit('sendMessage', { roomID, file: getFile, sender: userName, message, chatId, status: 'sent' });
    messageInput.value = ''
    // console.log('prevChats', prevChats)

    //..........clear all the thing........//
    setChatState(prev => !prev)
    const myDiv = document.getElementById('file-select-element');

    myDiv.style.display = 'none';
    setSelectedFile(null);
    setGetFile(null)
  }


  /////////////////////////////////////////////////////////////////////////////////

  /////////////////////////join room and message container empty on send////////////////////////////


  useEffect(() => {
    if (roomID) {
      socketRef.current.emit('joinRoom', roomID);
    }

    return () => {
      // Clean up by leaving the room when the component unmounts or roomID changes
      if (roomID) {
        socketRef.current.emit('leaveRoom', roomID);
      }
    };
  }, [socketRef, roomID]);

  useEffect(() => {
    if (messageContainerRef?.current && roomID) {
      messageContainerRef.current.innerHTML = '';
    }
  }, [roomID, messageContainerRef]);

  ///////////////////////////////////////////////////////////////////////

  //////////////////////////////emoji picker//////////////////////////

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prevState) => !prevState);
  };

  const handleEmojiSelect = useCallback(emoji => {

    setSelectedEmoji(emoji.event);
    console.log('selectedEmoji', emoji.event)
  }, [selectedEmoji, setSelectedEmoji])

  useEffect(() => {
    console.log('prevChats', prevChats)
    // console.log('userName.....', userName)
    // console.log('roomId....', roomID)
  }, [userName, prevChats])


  /////////////////////////////////////////////////////////////////////////

  //////////////////////// delete option chat////////////////////////////////

  function handleDelete(type, data) {
    console.log('data...', type, data);

    if (type === 'delete') {
      setPrevChats((prevMessages) =>
        prevMessages.map(message => {
          if (message.chatId == data.chatId) {
            socketRef.current.emit('chatDelete', { message, type, userName, roomID })
            return {
              ...message,
              deleteFrom: [userName]
            }

          }
          return message;
        })
      );
    } else if (type === 'deleteFromBoth') {
      setPrevChats((prev) =>
        prev.map((message) => {
          if (message.chatId === data.chatId) {
            // console.log('data for deleteFromBoth: ', message);
            socketRef.current.emit('chatDelete', { message, type, userName, roomID })
            return {
              ...message,
              deleteForEveryOne: true
            };
          }
          return message;
        })
      );
    }
  }





  // function handleDelete(type, data) {
  //   console.log('data...', type, data);

  //   if (type === 'delete') {
  //      setPrevChats((prevMessages) =>
  //       prevMessages.filter((message) => message !== data)
  //     );
  //   } else if (type === 'deleteFromBoth') {
  //     setPrevChats((prev) =>
  //       prev.map((message) => {
  //         if (message._id === data._id) {
  //           // console.log('data for deleteFromBoth: ', message);
  //           socketRef.current.emit('deleteFromBoth', { message, roomID })
  //           return {
  //             ...message,
  //             content: "You deleted this message",
  //             sender: null,
  //           };
  //         }
  //         return message;
  //       })
  //     );
  //   }
  // }


  //////////////////////////////////////////////////////////////////////

  ///////////////////////////////media upload////////////////////////////
  const handleFileChange = (e) => {
    const myDiv = document.getElementById('file-select-element');
    myDiv.style.display = 'block';
    setSelectedFile(e.target.files[0]);

    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    axios.post('http://localhost:32000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((response) => {
      // The response will contain the file information returned from the server
      console.log('file: ', response.data);
      setGetFile(response?.data);

    });
  };


  const handleClearSelection = () => {
    const myDiv = document.getElementById('file-select-element');
    myDiv.style.display = 'none';
    setSelectedFile(null);
    setGetFile(null)
  };
  ///////////////////////////////////////////////////////////////////

  ////////////////////////////media download/////////////////////////////

  const handleFileDownload = (data) => {

    if (!data || !data.filename || !data.path) {
      console.error('Invalid data for file download');
      return;
    }

    console.log('handleFileDownload data:', data)

    const url = `http://localhost:32000/download?filename=${encodeURIComponent(data.filename)}`;
    axios
      .get(url, { responseType: 'blob' })
      .then((response) => {
        // Create a Blob from the file data
        const fileBlob = new Blob([response.data], { type: 'application/pdf' });

        // Create a URL for the Blob
        const fileUrl = URL.createObjectURL(fileBlob);

        // Create a link element and trigger the download
        const downloadLink = document.createElement('a');
        downloadLink.href = fileUrl;
        downloadLink.download = data?.filename; // Set the desired file name
        downloadLink.click();

        // Clean up the URL object to free resources
        URL.revokeObjectURL(fileUrl);
      })
      .catch((error) => {
        console.error('File download error:', error);
      });
  };


  ////////////////////////////Group delete handle/////////////////////////////

  const handleGroupDelete = async () => {
    try {
      console.log('hittt delete')
      const response = await axios.delete(`http://localhost:32000/deleteGroup/${roomID}`);
      if (response.data) {
        console.log(response.data.message);
        setRefreshSidebar(prev => !prev)
        setOpenChat(false)
        alert('Group successfully deleted!')
      }
    } catch (error) {
      console.error('Error deleting message:', error.message);
    }

  };

  //////////////////////////////////////////////////////////////////////////////

  ////////////////////////////---------------jsx code---------------///////////////////////////////

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
          <IconButton data-bs-toggle="dropdown" aria-expanded="false"><MoreVertIcon />
          </IconButton>
          <ul class="dropdown-menu">
            <li><IconButton class="dropdown-item" onClick={handleAddMembers}>Add members</IconButton></li>
            <li><IconButton class="dropdown-item" onClick={handleGroupDelete} >Delete Group</IconButton></li>
            <li><IconButton class="dropdown-item" onClick={() => setOpenChat(false)}>Close chat</IconButton></li>
          </ul>
        </div>
      </div>

      <div ref={messageContainerRef} className="message-container chat_body">


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
          // console.log('data?.deleteFrom.includes(userName)', data?.deleteFrom.includes(userName))
          if (data?.deleteFrom && data?.deleteFrom.includes(userName)) {
            // If userName is found in data.deleteFrom, skip this data and return null
            return null;
          } else {
            if (data?.roomId?.includes(roomID)) {
              return (<>
                <p key={data?.chatId} className={data?.sender === userName ? "chat_message chat_receiver" : "chat_message"}>
                  <span className="chat_name">{data?.deleteForEveryOne ? null : (data?.sender === userName ? "You" : data?.sender)}</span>
                  <span className='chatMore'><IconButton data-bs-toggle="dropdown" aria-expanded="false"><ExpandMoreIcon /></IconButton>
                    <ul class="dropdown-menu">
                      <li><IconButton class="dropdown-item" onClick={() => handleDelete('delete', data)}>Delete</IconButton></li>
                      {data?.deleteForEveryOne ? null : (data?.sender === userName && <li><IconButton class="dropdown-item" onClick={() => handleDelete('deleteFromBoth', data)} >Delete For EveryOne</IconButton></li>)}
                    </ul>
                  </span>
                  <span style={{ display: 'inline' }} className={data?.deleteForEveryOne ? "chat chat-deleted" : "chat"}>{
                    data?.deleteForEveryOne ? (
                      <>
                        <DoDisturbAltIcon /> {"You deleted this message"}
                      </>
                    ) : (
                      data?.content
                    )}
                  </span>

                  {/* <a href={data?.file?.path} download={data?.file?.filename}>
                    {data?.file?.filename + " "}<FileDownloadIcon />
                  </a> */}

                  {data?.deleteForEveryOne ? null : (data?.file && (<span className='chatFile' >
                    <span>
                      {data?.file?.filename + " "} <IconButton style={{ marginLeft: "1rem" }} onClick={() => handleFileDownload(data?.file)}> <FileDownloadIcon /> </IconButton>
                    </span>
                  </span>))}
                  <span className="chat_timestamp">{data?.timestamp}</span>
                  {data?.deleteForEveryOne ? null : (data?.sender === userName && data?.sender !== null && (
                    <span className="tick">
                      {data.status == 'delivered' ? <DoneAllIcon /> : <DoneIcon />}
                    </span>
                  ))}
                </p>
              </>
              );
            }
          }
        })}




        {/* {Array.isArray(messages) && messages.map((data, index) => {
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
        })} */}

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



      <div id='file-select-element' style={{ display: 'none' }} className='chat-file-select'>
        {`Selected file:~  ${getFile?.filename}`}{' '}
        <IconButton onClick={handleClearSelection} style={{ marginLeft: '2rem' }}>
          <CloseIcon />
        </IconButton>
      </div>
      <div className="chat_footer">
        <IconButton onClick={toggleEmojiPicker}>
          <InsertEmoticonIcon />
        </IconButton>

        {showEmojiPicker && (
          //   <Picker data={data} onSelect={handleEmojiSelect} showPreview={false} style={{ position: 'absolute', bottom: '80px', right: '16px' }} />
          <div style={{ position: 'absolute', bottom: '80px', zIndex: '3', left: '30rem' }}><Picker data={data} onEmojiSelect={console.log} onSelect={handleEmojiSelect} /></div>
        )}
        <input
          id="file-upload"
          type="file"
          style={{ display: 'none' }}
          name='file'
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <IconButton
            component="span" // Use the IconButton as a wrapper
            aria-label="file"
          >
            <AttachFileIcon />
          </IconButton>
        </label>
        <form id='send-container' onSubmit={handleSubmit}>
          <input type="text" id='message-input' placeholder='Type a message' />
        </form>
        <IconButton>
          <MicIcon />
        </IconButton>
      </div>
    </div>
  )
}
