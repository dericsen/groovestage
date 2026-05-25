import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Socket.io for chat
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    });

    socket.on("send-message", (data) => {
      // data: { chatId, senderId, text, createdAt }
      io.to(data.chatId).emit("receive-message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API middleware
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Price suggestion endpoint (Rule-based for now)
  app.post("/api/price-suggest", (req, res) => {
    const { category, condition } = req.body;
    
    // Mock ranges
    const ranges: Record<string, Record<string, [number, number]>> = {
      "Guitar": {
        "New": [500, 2000],
        "Like New": [400, 1500],
        "Used": [200, 800],
        "Heavily Used": [50, 300]
      },
      "Keyboard": {
        "New": [300, 1500],
        "Like New": [250, 1200],
        "Used": [100, 600],
        "Heavily Used": [50, 250]
      }
    };

    const range = ranges[category]?.[condition] || [100, 500];
    res.json({ min: range[0], max: range[1] });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
