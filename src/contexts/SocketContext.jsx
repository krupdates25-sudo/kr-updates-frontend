import { createContext, useContext } from 'react';

const defaultSocketValue = {
  socket: null,
  connected: false,
  connectionError: null,
  joinPost: () => {},
  leavePost: () => {},
};

const SocketContext = createContext(defaultSocketValue);

export const useSocket = () => {
  // WebSocket is intentionally disabled; return a safe default when no provider is mounted.
  return useContext(SocketContext) || defaultSocketValue;
};

export const SocketProvider = ({ children }) => {
  // WebSocket removed for a cleaner, simpler auth + page flow.
  const value = defaultSocketValue;

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;
