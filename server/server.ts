import express, { Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import { stripeWebhook } from "./controllers/stripeWebhook.js";
import prisma from "./lib/prisma.js";

const app = express();

const corsOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(",") || [],
  credentials: true,
};

app.use(cors(corsOptions));
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json({ limit: "50mb" }));

app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});
app.use("/api/user", userRouter);
app.use("/api/project", projectRouter);

// Export for Vercel serverless
export default app;

// Keep NeonDB/PostgreSQL from going idle (runs every 5 min, minimal query)
const KEEPALIVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
function startDbKeepAlive() {
  const ping = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // Ignore errors - connection will retry on next request
    }
  };
  ping(); // Wake DB immediately if suspended
  setInterval(ping, KEEPALIVE_INTERVAL_MS);
}

// Keep listen for local development
if (process.env.NODE_ENV !== "production") {
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    startDbKeepAlive();
  });
}
