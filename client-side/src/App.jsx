import React, { useState, createContext, useContext } from 'react'
import Sidebar from './component/Sidebar';
import Chat from './component/Chat';
import './assets/app.css'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import DataContext from './DataContext';
import { useAuth0 } from "@auth0/auth0-react";

function App() {
  const [userName, setUserName] = useState()
  const [userEmail, setUserEmail] = useState()
  const [roomID, setRoomID] = useState()
  const [chatName, setChatName] = useState()
  const [open, setOpen] = useState(true);
  const handleClose = () => setOpen(false);
  const [privateNewMsg, setPrivateNewMsg] = useState([])
  const [ischatIconClicked, setChatIconClicked] = useState(false)
  const [privateNewMsgRec, setPrivateNewMsgRec] = useState([])
  const [privateChatData, setPrivateChatData] = useState(null)
  const [openChat, setOpenChat] = useState(false)
  const [allUsers, setAllUsers] = useState()
  const [refreshSidebar, setRefreshSidebar] = useState(true)


  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 300,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };


  ///////////////////login authentication///////////////////

  const { user, isAuthenticated, isLoading } = useAuth0();
  const { loginWithRedirect } = useAuth0()

  const handleBackdropClick = (event) => {
    // Prevent the modal from closing when clicking on the backdrop
    event.stopPropagation();
  };


  return (

    <>
      <div className='app'>
        <div className="app_body">

          {isLoading ? <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Wait a moment🥱....
            </Typography>
          </Box> :
            isAuthenticated ? <DataContext.Provider value={{ setRefreshSidebar, refreshSidebar, setAllUsers, allUsers, setUserEmail, userEmail, setChatIconClicked, ischatIconClicked, setChatName, userName, roomID, setRoomID, chatName, setUserName, setOpenChat, privateChatData, setPrivateChatData, privateNewMsgRec, setPrivateNewMsgRec, privateNewMsg, setPrivateNewMsg }}>
              <><Sidebar />
                {openChat ? <Chat /> : null}

                {/* //////////////////////group invitation modal///////////////////// */}
                
                


                {/* ///////////////////////////////////////////////////////////////// */}

              </></DataContext.Provider> :
              <>
                <Modal
                  open={open}
                  onClose={handleClose}
                  BackdropProps={{ onClick: handleBackdropClick }} // Prevent closing on backdrop click
                >
                  <Box sx={style} display="flex" alignItems="center">
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                      Login To Chat Please!
                    </Typography>
                    <Button
                      style={{ marginLeft: "20px" }}
                      onClick={() => loginWithRedirect()}
                      variant="contained"
                    >
                      Login
                    </Button>
                  </Box>
                </Modal>
              </>}
        </div>
      </div>
    </>

  )
}

export default App
