import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import store from './store.js'
import './global.css'
import App from './App.jsx'
import axios from 'axios';
import {baseUrl} from './settings/baseUrl.js'

axios.defaults.baseURL = `${baseUrl}/api/v2/`;

createRoot(document.getElementById('root')).render(
  <>
    {/* <StrictMode> */}
    <BrowserRouter>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <Provider store={store}>
            <App />
        </Provider>
      </GoogleOAuthProvider>
    </BrowserRouter>
    {/* </StrictMode> */}
  </>
)
