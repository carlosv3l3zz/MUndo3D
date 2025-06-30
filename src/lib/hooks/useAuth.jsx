import { useState, useEffect } from 'react';

const useAuthResponse = () => {
  const [authResponse, setAuthResponse] = useState(null);

  useEffect(() => {
    const storedValue = localStorage.getItem('authresponse');
    try {
      setAuthResponse(storedValue ? JSON.parse(storedValue) : null);
    } catch (error) {
      console.error('Error parsing authresponse from localStorage', error);
      setAuthResponse(null);
    }
  }, []);

  return authResponse;
};

export default useAuthResponse;