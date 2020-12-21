let io
const socketIO = require("socket.io")

module.exports = {
  initSocket: httpServer => {
    io = socketIO(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        // allowedHeaders: ["my-custom-header"],
        credentials: false,
      },
    })
    return io
  },
  socket() {
    if (!io) {
      throw Error("socket not initialized")
    }
    return io
  },
}
