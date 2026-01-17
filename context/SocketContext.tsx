
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);
export const useSocket = () => useContext(SocketContext);

const getSocketURL = () => {
  const { protocol, hostname, port } = window.location;
  
  const isLocal = hostname === 'localhost' || 
                  hostname === '127.0.0.1' || 
                  hostname.startsWith('192.168.') || 
                  hostname.startsWith('10.') || 
                  hostname.startsWith('172.');

  if (isLocal && port !== '3000') {
    return `${protocol}//${hostname}:3000`;
  }
  
  return window.location.origin;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const url = getSocketURL();
    
    const s = io(url, {
      transports: ["polling", "websocket"], 
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 5000,
      timeout: 10000,
      autoConnect: true,
      withCredentials: false
    });

    s.on("connect", () => {
      console.log("[SocketContext] Link Established:", s.id);
    });

    s.on("connect_error", (err) => {
      console.debug("[SocketContext] Retrying neural link...", err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
