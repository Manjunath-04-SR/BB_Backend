import { Router } from "express";
import { generateRoadmap } from "../controllers/roadmap.controller.ts";

const router = Router();

// POST /api/roadmap/generate — no auth required (preview without signup)
router.post("/generate", generateRoadmap);

export default router;
