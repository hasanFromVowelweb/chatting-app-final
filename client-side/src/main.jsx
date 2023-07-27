import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App';
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react';
import { createRoot } from 'react-dom/client';



ReactDOM.createRoot(document.getElementById('root')).render(
  <Auth0Provider
      domain="dev-d7ntgqd1fnpw8r7u.us.auth0.com"
      clientId="Lqv4DUKWUaZdePBDpGWy4lPSizXJOFfv"
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
  <React.StrictMode>
      <App />
  </React.StrictMode>
  </Auth0Provider>,
)
