const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// ✅ Multer Configuration for Multiple Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage }).array("images", 5); // ✅ Accept multiple images (Max 5)

// ✅ Serve Static Uploads Folder
router.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// 📌 Add Product API with Multiple Image Uploads
router.post("/products", upload, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required!" });
    }

    // ✅ Store multiple image URLs
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    const product = new Product({
      brand: req.body.brand,
      title: req.body.title,
      info: req.body.info,
      category: req.body.category,
      type: req.body.type,
      connectivity: req.body.connectivity,
      finalPrice: req.body.finalPrice,
      originalPrice: req.body.originalPrice,
      imageUrls, // ✅ Save multiple image URLs
    });

    await product.save();
    res.status(201).json({
      message: "Product added successfully!",
      product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ message: "Error adding product", error });
  }
});

// 📌 Edit Product API (✅ NEW)
router.put("/products/:id", upload, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Handle Image Updates
    let imageUrls = product.imageUrls; // Default: Keep existing images

    if (req.files && req.files.length > 0) {
      // ✅ Delete Old Images from Server
      product.imageUrls.forEach(img => {
        const imagePath = path.join(__dirname, "..", img.replace("http://localhost:5000", ""));
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });

      // ✅ Store New Images
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    // ✅ Update Product Fields
    product.brand = req.body.brand || product.brand;
    product.title = req.body.title || product.title;
    product.info = req.body.info || product.info;
    product.category = req.body.category || product.category;
    product.type = req.body.type || product.type;
    product.connectivity = req.body.connectivity || product.connectivity;
    product.finalPrice = req.body.finalPrice || product.finalPrice;
    product.originalPrice = req.body.originalPrice || product.originalPrice;
    product.imageUrls = imageUrls;

    await product.save();
    res.status(200).json({ message: "Product updated successfully!", product });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error });
  }
});

// 📌 Get All Products API
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();

    // ✅ Fix Duplicate localhost Issue
    const formattedProducts = products.map(product => ({
      ...product._doc,
      imageUrls: product.imageUrls.map(img =>
        img.startsWith("/uploads") ? `http://localhost:5000${img}` : img
      )
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ message: "Error retrieving products", error });
  }
});

// 📌 Get Product Details API
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const formattedProduct = {
      ...product._doc,
      imageUrls: product.imageUrls.map(img =>
        img.startsWith("/uploads") ? `http://localhost:5000${img}` : img
      ),
    };

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error("Error retrieving product details:", error);
    res.status(500).json({ message: "Error retrieving product details", error });
  }
});

// 📌 Delete Product API
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Delete Images from Server
    product.imageUrls.forEach(img => {
      const imagePath = path.join(__dirname, "..", img.replace("http://localhost:5000", ""));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    res.status(200).json({
      message: "Product deleted successfully",
      deletedProduct: product,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Failed to delete product", error });
  }
});

module.exports = router;
