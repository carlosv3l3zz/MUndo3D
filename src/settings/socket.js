let socket = null;

export const getSocket = () => {
  const authResponse = JSON.parse(localStorage.getItem("authResponse")) || {};

  if (!authResponse) {
    console.log("❌ No se puede conectar el socket: no se encontro authResponse");
    return null;
  }

  // Ya conectado, no crear otro
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  // Si ya está en proceso de conexión o reconexión, lo reutiliza
  if (socket && socket.readyState === WebSocket.CONNECTING) {
    return socket;
  }

  // Crear nueva conexión WebSocket
  const SOCKET_SERVER_URL = `ws://localhost:3000/ws`;
  socket = new WebSocket(SOCKET_SERVER_URL);

  socket.addEventListener("open", () => {
    console.log("✅ Conectado al WebSocket server");
  });

  socket.addEventListener("close", () => {
    console.log("🔌 Conexión cerrada");
  });

  socket.addEventListener("error", (err) => {
    console.error("❗ Error en WebSocket:", err);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    console.log("🔌 Socket desconectado manualmente");
  }
};