const Lead = require("../models/lead.model");
const { normalizeLeadStatus } = require("../models/lead.model");
const Employee = require("../models/employee.model");
const Settings = require("../models/Settings");
const sendEmail = require("../utils/sendEmail");
const { normalizeLeadCustomFieldValues } = require("../utils/leadFormConfig");

const otpStore = new Map(); // temporary in-memory storage
const DAY_MS = 24 * 60 * 60 * 1000;

const daysSince = (date) => {
  if (!date) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS),
  );
};

const getAgingTone = (lead) => {
  const leadAgeDays = daysSince(lead.createdAt) || 0;
  const lastContactDays =
    daysSince(lead.lastActivityAt || lead.assignedAt || lead.createdAt) || 0;

  if (lastContactDays >= 5 || leadAgeDays >= 15) return "red";
  if (lastContactDays >= 2 || leadAgeDays >= 7) return "yellow";
  return "green";
};

const areEmployeesEnabled = async () => {
  const settings = await Settings.findOne();
  return settings?.modules?.employees !== false;
};

const decorateLead = (lead, options = {}) => {
  const includeEmployeeFields = options.includeEmployeeFields !== false;
  const plainLead =
    typeof lead.toObject === "function"
      ? lead.toObject({
          flattenMaps: true,
        })
      : lead;
  const lastActivityAt =
    plainLead.lastActivityAt || plainLead.assignedAt || plainLead.createdAt;
  const lastFollowUpActivity = [...(plainLead.activityLog || [])]
    .reverse()
    .find((item) => item.type === "follow-up");

  const decoratedLead = {
    ...plainLead,
    leadStatus: normalizeLeadStatus(plainLead.leadStatus),
    aging: {
      leadAgeDays: daysSince(plainLead.createdAt) || 0,
      lastContactDays: daysSince(lastActivityAt) || 0,
      noFollowUpDays: lastFollowUpActivity
        ? daysSince(lastFollowUpActivity.createdAt) || 0
        : daysSince(plainLead.assignedAt || plainLead.createdAt) || 0,
      tone: getAgingTone(plainLead),
    },
  };

  if (!includeEmployeeFields) {
    delete decoratedLead.assignedTo;
    delete decoratedLead.assignedAt;
    delete decoratedLead.lastActivityAt;
    delete decoratedLead.leadStatus;
    delete decoratedLead.followUpDate;
    delete decoratedLead.followUpRemark;
    delete decoratedLead.notes;
    delete decoratedLead.activityLog;
    delete decoratedLead.aging;
  }

  return decoratedLead;
};

/* ============================
   SEND OTP
=============================== */
exports.sendOTP = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Basic validation
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        message: "Name, email, phone and message are required",
      });
    }

    // Check duplicate email
    const existingLead = await Lead.findOne({ email });
    if (existingLead) {
      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        message: "Email already registered.",
      });
    }

    const settings = await Settings.findOne();
    const customFieldConfig = settings?.leadForm?.customFields || [];
    const customFieldsResult = normalizeLeadCustomFieldValues(
      customFieldConfig,
      req.body.customFields,
    );

    if (!customFieldsResult.valid) {
      return res.status(400).json({
        success: false,
        message: customFieldsResult.message,
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP with lead data
    otpStore.set(email, {
      otp,
      data: {
        name,
        email,
        phone,
        message,
        customFields: customFieldsResult.values,
      },
      createdAt: Date.now(),
    });

    // Send OTP Email
    await sendEmail({
      to: email,
      subject: "Your OTP - HPMC",
      html: `
        <h2>Hello ${name},</h2>
        <p>Your verification OTP is:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      message: "Server error while sending OTP",
    });
  }
};

/* ============================
   VERIFY OTP & SAVE LEAD
=============================== */
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({
        message: "OTP expired or not found",
      });
    }

    // Check expiry (5 minutes)
    const isExpired = Date.now() - record.createdAt > 5 * 60 * 1000;
    if (isExpired) {
      otpStore.delete(email);
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (parseInt(otp) !== record.otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Save Lead
    const newLead = new Lead({
      ...record.data,
      verified: true,
      activityLog: [
        {
          type: "created",
          message: "Lead created from website inquiry",
        },
      ],
    });

    await newLead.save();
    otpStore.delete(email);

    /* ===== Confirmation Email ===== */
    await sendEmail({
      to: email,
      subject: "We Received Your Request - HPMC",
      html: `
        <h2>Hello ${record.data.name},</h2>
        <p>Thank you for contacting HPMC.</p>
        <p>Our team will connect with you shortly.</p>
      `,
    });

    /* ===== Internal Notification ===== */
    await sendEmail({
      to: "chandangomia2812@gmail.com",
      subject: "New Lead - HPMC",
      html: `
  <h2>New Lead Inquiry</h2>

  <p><strong>Name:</strong> ${record.data.name}</p>

  <p><strong>Email:</strong> ${record.data.email}</p>

  <p><strong>Phone:</strong> ${record.data.phone}</p>

  ${
    record.data.customFields && Object.keys(record.data.customFields).length
      ? `<h3>Custom Fields</h3>${Object.entries(record.data.customFields)
          .map(
            ([key, value]) =>
              `<p><strong>${key}:</strong> ${Array.isArray(value) ? value.join(", ") : value || "-"}</p>`,
          )
          .join("")}`
      : ""
  }

  <p>
    <strong>Message:</strong><br/>
    ${record.data.message || "-"}
  </p>
`,
    });

    res.status(200).json({
      success: true,
      message: "Lead verified and saved successfully.",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      message: "Server error while verifying OTP",
    });
  }
};

/* ============================
   GET ALL LEADS
=============================== */
exports.getAllLeads = async (req, res) => {
  try {
    const includeEmployeeFields = await areEmployeesEnabled();
    let query = Lead.find().sort({ createdAt: -1 });

    if (includeEmployeeFields) {
      query = query
        .populate("assignedTo", "name email")
        .populate("notes.createdBy", "name email")
        .populate("activityLog.employee", "name email");
    }

    const leads = await query;
    res
      .status(200)
      .json(leads.map((lead) => decorateLead(lead, { includeEmployeeFields })));
  } catch (err) {
    console.error("Error fetching leads:", err);
    res.status(500).json({ message: "Server error while fetching leads." });
  }
};

exports.getAllLeadActivity = async (req, res) => {
  try {
    const includeEmployeeFields = await areEmployeesEnabled();

    if (!includeEmployeeFields) {
      return res.status(200).json({
        success: true,
        activity: [],
      });
    }

    const leads = await Lead.find()
      .select(
        "name phone email leadStatus assignedTo activityLog createdAt lastActivityAt",
      )
      .populate("assignedTo", "name email")
      .populate("activityLog.employee", "name email")
      .sort({ lastActivityAt: -1, createdAt: -1 });

    const activity = leads
      .flatMap((lead) =>
        (lead.activityLog || []).map((item) => ({
          ...item.toObject(),
          lead: {
            _id: lead._id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            leadStatus: lead.leadStatus,
            assignedTo: lead.assignedTo,
            aging: decorateLead(lead).aging,
          },
        })),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 100);

    res.status(200).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Error fetching lead activity:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching lead activity.",
    });
  }
};

/* ============================
   DELETE LEAD
=============================== */
exports.deleteLead = async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found." });
    }

    res.status(200).json({ message: "Lead deleted successfully." });
  } catch (err) {
    console.error("Error deleting lead:", err);
    res.status(500).json({ message: "Server error while deleting lead." });
  }
};

exports.assignLead = async (req, res) => {
  try {
    const includeEmployeeFields = await areEmployeesEnabled();

    if (!includeEmployeeFields) {
      return res.status(403).json({
        success: false,
        message: "Employee module is disabled. Lead assignment is unavailable.",
      });
    }

    const { leadId, employeeId } = req.body;

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: "Lead id is required",
      });
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    let employee = null;

    if (employeeId) {
      employee = await Employee.findOne({ _id: employeeId, active: true });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
    }

    lead.assignedTo = employee ? employee._id : null;
    lead.assignedAt = employee ? new Date() : null;
    lead.lastActivityAt = new Date();
    lead.activityLog.push({
      type: "assigned",
      employee: employee ? employee._id : null,
      message: employee
        ? `Lead assigned to ${employee.name}`
        : "Lead assignment removed",
    });

    await lead.save();
    await lead.populate("assignedTo", "name email");
    await lead.populate("activityLog.employee", "name email");

    res.status(200).json({
      success: true,
      lead: decorateLead(lead),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
