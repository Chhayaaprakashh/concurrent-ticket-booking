import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

// ✅ Redis client
const client = createClient();
client.on("error", err => console.log("Redis error:", err));

await client.connect();

// 🎟️ Dummy seats
const seats = {
  A1: "available",
  A2: "available",
  A3: "available",
  A4: "available"
};

// ===============================
// ✅ View all seats
// ===============================
app.get("/seats", (req, res) => {
  res.json(seats);
});

// ===============================
// ✅ Book seat with Redis lock
// ===============================
app.post("/book/:seatId", async (req, res) => {
  const seatId = req.params.seatId;

  if (!seats[seatId]) {
    return res.status(404).json({ message: "Seat not found" });
  }

  const lockKey = `lock:${seatId}`;

  // 🔒 Try to acquire lock
  const lock = await client.set(lockKey, "locked", {
    NX: true,
    EX: 10 // lock expires in 10 sec
  });

  if (!lock) {
    return res.status(409).json({
      message: "Seat is currently being booked by another user"
    });
  }

  try {
    if (seats[seatId] === "booked") {
      return res.status(400).json({ message: "Seat already booked" });
    }

    // simulate processing delay (important for concurrency demo)
    await new Promise(r => setTimeout(r, 2000));

    seats[seatId] = "booked";

    res.json({ message: `Seat ${seatId} booked successfully` });

  } finally {
    // 🔓 release lock
    await client.del(lockKey);
  }
});

// ===============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Ticket server running on port ${PORT}`);
});