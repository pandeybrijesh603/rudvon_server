import express from "express";
import Category from "../models/Category.js";

const router = express.Router();

/* =========================================
   ✅ GET ALL CATEGORIES
   ========================================= */
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =========================================
   ✅ CREATE NEW CATEGORY
   ========================================= */
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    // Check if category already exists
    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Create and save new category
    const newCategory = new Category({ name: name.trim() });
    await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
