import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { disconnectSocket } from '@/settings/socket.js';
import useAuth from '@/lib/hooks/useAuth';

/*Routes*/
import Ubication from '@/pages/Ubication.jsx'
/*End::Routes*/

/*Routes Protection*/
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();

  if (auth === null) return <Navigate to="/" />;
  return children;
};
/*End::Routes Protection*/

function App() {
  const location = useLocation();
  const auth = useAuth();

  useEffect(() => {
    if (!auth) return;

    const handleDisconnect = () => {
      disconnectSocket();
    };

    window.addEventListener('beforeunload', handleDisconnect);

    return () => {
      window.removeEventListener('beforeunload', handleDisconnect);
      handleDisconnect();
    };
  }, [auth, location.pathname]);

  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
          <Route path="/" element={<Ubication />} />
        {/* END::PUBLIC ROUTES */}
          
        {/* PRIVATE ROUTES */}

        {/* END::PRIVATE ROUTES */}

        {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        {/* END::404 */}
      </Routes>
    </>
  )
}

export default App
