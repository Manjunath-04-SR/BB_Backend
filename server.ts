// Disable SSL cert verification globally — fixes "unable to get local issuer
// certificate" errors caused by corporate proxies / Windows cert store gaps.
// Safe for a dev/internal server; remove before exposing to the public internet.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import connectDB from "./config/db.ts";

import authRoutes from "./routes/auth.routes.ts";
import userRoutes from "./routes/user.routes.ts";
import courseRoutes from "./routes/course.routes.ts";
import topicRoutes from "./routes/topic.routes.ts";
import subtopicRoutes from "./routes/subtopic.routes.ts";
import enrollmentRoutes from "./routes/enrollment.routes.ts";
import problemRoutes from "./routes/problem.routes.ts";
import compileRoutes from "./routes/compile.routes.ts";
import companyRoutes from "./routes/company.routes.ts";
import interviewExperienceRoutes from "./routes/interview-experience.routes.ts";
import resourceRoutes from "./routes/resource.routes.ts";
import contestRoutes from "./routes/contest.routes.ts";
import resumeRoutes from "./routes/resume.routes.ts";
import mockRoutes from "./routes/mock.routes.ts";
import chatbotRoutes from "./routes/chatbot.routes.ts";
import jobsRoutes from "./routes/jobs.routes.ts";

dotenv.config();

const app = express();

connectDB();

// CORS — allow frontend dev server
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000", "*"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan("dev"));

// Health check
app.get("/api", (_req, res) => {
  res.json({ status: "ok", message: "BeyondBasic API is running", timestamp: new Date().toISOString() });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "BeyondBasic API is running", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/course", courseRoutes);
app.use("/api/topic", topicRoutes);
app.use("/api/subtopic", subtopicRoutes);
app.use("/api/enrollment", enrollmentRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/compile",  compileRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/interview-experience", interviewExperienceRoutes);
app.use("/api/resource", resourceRoutes);
app.use("/api/contest", contestRoutes);
app.use("/api/resume",  resumeRoutes);
app.use("/api/mock",    mockRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/jobs",   jobsRoutes);

app.get("/", (_req, res) => {
  res.send("BeyondBasic API running...");
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
