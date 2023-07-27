import React, { useEffect, useState, useContext } from 'react'
import '../assets/sidebar.css'
import { Avatar, IconButton, Popper, Box, Button, Menu, MenuItem } from '@mui/material';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import MessageIcon from '@mui/icons-material/Message';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import SidebarChat from './SidebarChat';
import GroupsIcon from '@mui/icons-material/Groups';
import { useAuth0 } from "@auth0/auth0-react";
import DataContext from '../DataContext';
import axios from 'axios'


export default function Sidebar() {

  const { refreshSidebar, setRefreshSidebar, setUserEmail, userEmail, setUserName, userName, setRoomID, setChatIconClicked, setChatName, prevChat, setOpenChat, privateNewMsg, setEmptyChat, setPrivateChatData, privateNewMsgRec } = useContext(DataContext);

  ///////////////////login authentication////////////////////
  const { loginWithRedirect } = useAuth0();
  const { logout } = useAuth0();
  const [groups, setGroups] = useState('')
  const [privateSidebar, setPrivatesidebar] = useState('')

  const { user, isAuthenticated, isLoading } = useAuth0();

  if (!isLoading) {
    setUserName(user?.nickname)
    setUserEmail(user?.email)
  }

  ////////////////////////////////////////////////////////

  function handleClickChat(roomId, chatName) {
    console.log('clicked a chat sidebar')
    setRoomID(roomId) // using in chat.jsx component
    setChatName(chatName) // using in chat.jsx component
    setOpenChat(true) // using in app.js to toggle chat component
  }


  function handlePrivateChatSent(privateRoomID, sender, recipient) {
    console.log('privateRoomID', privateRoomID)
    console.log('sender', sender)
    console.log('recipient', recipient)
    setRoomID(privateRoomID)
    setChatName(recipient)
    setOpenChat(true)

    // setPrivateChatData({privateRoomID,recipient})
  }


  function handlePrivateChatReceive(privateRoomID, sender, recipient) {
    console.log('privateRoomID', privateRoomID)
    console.log('sender', sender)
    console.log('recipient', recipient)
    setRoomID(privateRoomID)
    setChatName(sender)
    setOpenChat(true)

    // setPrivateChatData({privateRoomID,sender})

  }

  /////////////////////group chat////////////////////////

  async function handleGroupChatClick() {
    const groupName = prompt('Enter a name of group to create.');
    console.log('this is a name of a group: ', groupName);

    if (groupName) {
      try {
        setTimeout(() => {
          setRefreshSidebar((prev) => !prev);
        }, 1000)

        console.log('hitttttttttttttttttttttttt,,,', groupName);

        const response = await axios.post('http://localhost:32000/createGroup', {
          groupName,
          createdBy: userName,
        })

        console.log('response for group create: ', response?.data);

      } catch (error) {
        console.log('error occured on group create', error);
        alert("Sorry group isn't get created will inform the issue to the developer!");
      }
    } else {
      return
    }

  }



  useEffect(() => {
    // Define an inner async function
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:32000/getGroup');

        // console.log('response for group get: ', response?.data);
        setGroups(response?.data)
      } catch (error) {
        console.log('error occurred on group create', error);
      }
    };

    // Call the inner async function immediately
    fetchData();
  }, [refreshSidebar]);

  
  useEffect(() => {
    // Define an inner async function
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:32000/getPrivate');

        // console.log('response for group get: ', response?.data);
        setPrivatesidebar(response?.data)
      } catch (error) {
        console.log('error occurred on group create', error);
      }
    };

    // Call the inner async function immediately
    fetchData();
  }, [refreshSidebar]);

  useEffect(() => {
    console.log('groups....', groups)
  }, [groups])
  ///////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  ////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////

  // Combine the arrays of privateNewMsg, privateNewMsgRec, and groups
  const allChats = [...privateNewMsg, ...privateNewMsgRec, ...groups];

  // Sort the merged array based on timestamp or any other criterion (descending order)
  allChats.sort((a, b) => a.timestamp - b.timestamp);
  ///////////////////////////////////////////////////////////////////////////////////////////

  return (
    <div className='sidebar'>
      <div className="sidebar_header">

        <IconButton
          id="basic-button"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
        >
          <Avatar src={isAuthenticated ? user.picture : ''} />
        </IconButton>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button',
          }}
        >
          {isAuthenticated ? <>
            <MenuItem onClick={handleClose}>Hi, {user.nickname}</MenuItem>
            <MenuItem onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>LogOut</MenuItem></> :
            <MenuItem onClick={() => loginWithRedirect()}>LogIn</MenuItem>
          }
        </Menu>

        <div className="sidebar_headerRight">
          {/* <IconButton>
            <DonutLargeIcon />
          </IconButton> */}
          <IconButton onClick={handleGroupChatClick}>
            <GroupsIcon fontSize='medium' />
          </IconButton>
          <IconButton onClick={() => { setChatIconClicked(true) }}>
            <MessageIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </div>
      </div>

      <div className="sidebar_search">
        <div className="sidebar_searchContainer">
          <SearchIcon />
          <input type="text" placeholder='Enter name or start new chat' />
        </div>
      </div>
      <div id='newPrivateChats' className="sidebarChats">
        {/*           
        {Array.isArray(privateNewMsg) &&
          privateNewMsg.map((item, i) => {
            console.log('item....', item);
            return (
              <SidebarChat
                onClick={() => handleClickChat(item?.name, item?.name)}
                groupName={item?.name}
                lastmsg={item?.message?.message}
              />
            );
          })
        } */}

        {/* {Array.isArray(privateNewMsg) &&
          privateNewMsg.map((item, i) => {
            // console.log('item....', item);
            return (
              <SidebarChat
                onClick={() => handlePrivateChatSent( item?.privateRoomID, item?.sender,item?.recipient)}
                groupName={item?.recipient}
                lastmsg={'this is the last message'}
              />
            );
          })
        } */}

        {/* {Array.isArray(privateNewMsgRec) &&
          privateNewMsgRec.map((item, i) => {
            // console.log('item....', item);
            return (
              <SidebarChat
                onClick={() => handlePrivateChatReceive( item?.privateRoomID, item?.sender,item?.recipient)}
                groupName={item?.sender}
                lastmsg={'this is the last message'}
              />
            );
          })
        } */}

        {/* ///////////////////////group///////////////////////////// */}
        {/* groups.members.includes(userName) && */}
        {/* { Array.isArray(groups) &&
          groups.map((item, i) => {
            console.log('item....', item);
            if (item.members.includes(userName)) {
              return (
                <SidebarChat
                  onClick={() => handleClickChat( item?.roomID, item?.groupName)}
                  groupName={item?.groupName}
                  lastmsg={item?.lastMsg}
                />
              );
            }else {
              null
            }
            
          })
        } */}

        {/* ///////////////////////////////////////////////////////// */}


        {Array.isArray(allChats) &&
          allChats.map((item, i) => {
            if (item.privateRoomID) {
              return (
                <SidebarChat
                  key={item.privateRoomID}
                  onClick={() => {
                    if (item.sender === userName) {
                      handlePrivateChatSent(item.privateRoomID, item.sender, item.recipient);
                    } else {
                      handlePrivateChatReceive(item.privateRoomID, item.sender, item.recipient);
                    }
                  }}
                  groupName={item.sender === userName ? item.recipient : item.sender}
                  lastmsg={'this is the last message'}
                />
              );
            } else if (item.members && item.members.includes(userName)) {
              return (
                <SidebarChat
                  key={item.roomID}
                  onClick={() => handleClickChat(item.roomID, item.groupName)}
                  groupName={item.groupName}
                  lastmsg={item.lastMsg}
                />
              );
            }
            return null;
          })}

        {/* ////////////////////////////////////////////////////////// */}

        <SidebarChat
          onClick={() => handleClickChat('chat1', 'Group 1')}
          groupName={'Group 1'}
          lastmsg={'chat 1 last message'}
        />
        
        <SidebarChat
          onClick={() => handleClickChat('chatGroup1', 'Group 2')}
          groupName={'Group 2'}
          lastmsg={'group 1 last message'}
        />

        <SidebarChat
          onClick={() => handleClickChat('chatGroup2', 'Group 3')}
          groupName={'Group 3'}
          lastmsg={'group 2 last message'}
        />
      </div>
    </div>
  )
}
