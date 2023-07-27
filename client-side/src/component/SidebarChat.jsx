import React from 'react'
import '../assets/sidebarChat.css'
import { Avatar } from '@mui/material';
import { IconButton } from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';


export default function SidebarChat({ onClick, groupName, lastmsg }) {
    return (
        <div className='sidebarChat' onClick={onClick}>
            <Avatar />
            <div className="sidebarChat_info">
                <h2>{groupName}</h2>
                <p>{lastmsg} <PriorityHighIcon id='alertIcon'/></p>
            </div>
        </div>
    )
}
