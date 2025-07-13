import { Router } from "express";

const router = Router();

// Common template data
const getTemplateData = (title: string) => ({
  title,
});

// Serve the landing page
router.get("/", (req, res) => {
  res.render("pages/home", getTemplateData("Home"));
});

// Serve the privacy policy
router.get("/privacy", (req, res) => {
  res.render("pages/privacy", getTemplateData("Privacy Policy"));
});

// Serve the terms and conditions
router.get("/terms", (req, res) => {
  res.render("pages/terms", getTemplateData("Terms & Conditions"));
});

export default router;
