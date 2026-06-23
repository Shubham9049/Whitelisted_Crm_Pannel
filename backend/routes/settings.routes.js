const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = require("../config/storage");
const upload = multer({ storage });

const settingsController = require("../controllers/settingsController");

router.get("/", settingsController.getSettings);

router.put(
  "/branding",
  upload.single("logo"),
  settingsController.updateBranding,
);

router.put("/modules", settingsController.updateModules);

module.exports = router;
