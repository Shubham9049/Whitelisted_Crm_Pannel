const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  branding: {
    companyName: {
      type: String,
      default: "",
    },

    logo: {
      type: String,
      default: "",
    },
  },

  modules: {
    leads: {
      type: Boolean,
      default: true,
    },

    blogs: {
      type: Boolean,
      default: true,
    },

    agents: {
      type: Boolean,
      default: true,
    },

    employees: {
      type: Boolean,
      default: true,
    },

    newsletter: {
      type: Boolean,
      default: true,
    },

    subscribers: {
      type: Boolean,
      default: true,
    },

    vendors: {
      type: Boolean,
      default: true,
    },

    siteVisits: {
      type: Boolean,
      default: true,
    },

    openings: {
      type: Boolean,
      default: true,
    },

    jobApplications: {
      type: Boolean,
      default: true,
    },
  },
});

module.exports = mongoose.model("Settings", settingsSchema);
