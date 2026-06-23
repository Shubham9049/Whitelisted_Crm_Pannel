const Settings = require("../models/Settings");

/* =====================================
   GET SETTINGS
===================================== */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};

/* =====================================
   UPDATE BRANDING
===================================== */
exports.updateBranding = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    if (req.body.companyName) {
      settings.branding.companyName = req.body.companyName;
    }

    if (req.file) {
      settings.branding.logo = req.file.secure_url || req.file.path;
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Branding updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("UPDATE BRANDING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update branding",
    });
  }
};

/* =====================================
   UPDATE MODULES
===================================== */
exports.updateModules = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.modules = {
      ...settings.modules.toObject(),
      ...req.body,
    };

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Modules updated successfully",
      data: settings.modules,
    });
  } catch (error) {
    console.error("UPDATE MODULES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update modules",
    });
  }
};
