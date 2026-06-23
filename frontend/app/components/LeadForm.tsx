"use client";

import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useLeadFormSettings } from "../hooks/useLeadFormSettings";
import type { LeadCustomField } from "../types/leadForm";

type FormDataType = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type CustomFieldValues = Record<string, string | boolean>;

interface LeadFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

const inputStyle = {
  background: "var(--background)",
  color: "var(--text-primary)",
  borderColor: "var(--border)",
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function LeadForm({ onSuccess, compact = false }: LeadFormProps) {
  const { leadForm } = useLeadFormSettings();
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverError, setServerError] = useState("");
  const [currentStep, setCurrentStep] = useState<"form" | "otp" | "success">(
    "form",
  );

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [customFields, setCustomFields] = useState<CustomFieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCustomFieldChange = (
    field: LeadCustomField,
    value: string | boolean,
  ) => {
    setCustomFields((prev) => ({ ...prev, [field.id]: value }));
    if (errors[field.id]) setErrors((prev) => ({ ...prev, [field.id]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";

    leadForm.customFields.forEach((field) => {
      const value = customFields[field.id];
      const isEmpty =
        field.type === "checkbox" ? !value : !String(value || "").trim();

      if (field.required && isEmpty) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
    });
    setCustomFields({});
    setOtp("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setServerError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/lead/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            customFields,
          }),
        },
      );

      const data = await response.json();

      if (data.alreadyRegistered) {
        onSuccess?.();
        setServerError(data.message || "Email already registered.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      localStorage.setItem(
        "catalogue_access",
        JSON.stringify({ email: formData.email, verified: true }),
      );

      setCurrentStep("otp");
      onSuccess?.();
    } catch (error) {
      setServerError(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setServerError("Please enter OTP");
      return;
    }

    try {
      setOtpLoading(true);
      setServerError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/lead/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, otp }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      setCurrentStep("success");
      onSuccess?.();
      resetForm();

      setTimeout(() => setCurrentStep("form"), 2500);
    } catch (error) {
      setServerError(getErrorMessage(error, "Failed to verify OTP"));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden">
      {!compact && (
        <>
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[var(--primary)]/10 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[var(--primary)]/10 blur-3xl" />
        </>
      )}

      <div
        className={
          compact
            ? "relative"
            : "relative grid gap-5 xl:grid-cols-[320px_1fr]"
        }
      >
        {!compact && <LeadValuePanel />}

        {currentStep === "form" && (
          <form
            onSubmit={handleSubmit}
            className="relative overflow-hidden rounded-[28px] border p-4 md:p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <StepHeader step="form" />

            <div className="mb-6 text-center">
              <span className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-medium text-[var(--primary)]">
                Quick Inquiry
              </span>
              <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
                Request a Consultation
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] md:text-base">
                Fill out the form and our experts will contact you shortly.
              </p>
            </div>

            {serverError && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
                {serverError}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell error={errors.name}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 outline-none transition-all focus:border-[var(--primary)]"
                  style={inputStyle}
                />
              </FieldShell>

              <FieldShell error={errors.email}>
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 outline-none transition-all focus:border-[var(--primary)]"
                  style={inputStyle}
                />
              </FieldShell>

              <FieldShell error={errors.phone}>
                <div
                  className="rounded-2xl border px-4 py-4"
                  style={inputStyle}
                >
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={formData.phone}
                    onChange={(value) => handleChange("phone", value || "")}
                  />
                </div>
              </FieldShell>

              {leadForm.customFields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={customFields[field.id]}
                  error={errors[field.id]}
                  onChange={(value) => handleCustomFieldChange(field, value)}
                />
              ))}
            </div>

            <div className="mt-8">
              <FieldShell error={errors.message}>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="Tell us about your requirements... *"
                  className="w-full resize-none rounded-2xl border px-4 py-3 outline-none transition-all focus:border-[var(--primary)]"
                  style={inputStyle}
                />
              </FieldShell>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-[var(--primary)] px-6 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending OTP...
                </div>
              ) : (
                "Request Consultation"
              )}
            </button>
          </form>
        )}

        {currentStep === "otp" && (
          <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
            <StepHeader step="otp" />
            <span className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-medium text-[var(--primary)]">
              Step 2 of 2
            </span>
            <h2 className="mt-6 text-3xl font-bold text-[var(--text-primary)]">
              Verify Your Email
            </h2>
            <p className="mt-3 max-w-md text-[var(--text-secondary)]">
              We have sent a verification code to
            </p>
            <p className="mt-1 font-semibold text-[var(--primary)]">
              {formData.email}
            </p>
            {serverError && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">
                {serverError}
              </div>
            )}
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              className="mt-8 w-full max-w-md rounded-2xl border p-5 text-center text-4xl font-bold tracking-[12px] outline-none"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpLoading}
              className="mt-6 w-full max-w-md rounded-2xl bg-green-600 py-4 font-semibold text-white disabled:opacity-60"
            >
              {otpLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}

        {currentStep === "success" && (
          <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-5xl text-white">
              ✓
            </div>
            <h2 className="mt-8 text-3xl font-bold text-green-600">
              Inquiry Submitted Successfully
            </h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Thank you for contacting us.
            </p>
            <p className="text-[var(--text-secondary)]">
              Our team will connect with you shortly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DynamicField({
  field,
  value,
  error,
  onChange,
}: {
  field: LeadCustomField;
  value: string | boolean | undefined;
  error?: string;
  onChange: (value: string | boolean) => void;
}) {
  const placeholder =
    field.placeholder || `${field.label}${field.required ? " *" : ""}`;

  if (field.type === "textarea") {
    return (
      <FieldShell error={error} className="md:col-span-2">
        <textarea
          rows={4}
          placeholder={placeholder}
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-none rounded-2xl border px-4 py-3 outline-none transition-all focus:border-[var(--primary)]"
          style={inputStyle}
        />
      </FieldShell>
    );
  }

  if (field.type === "select") {
    return (
      <FieldShell error={error}>
        <select
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="h-[50px] w-full rounded-2xl border px-4 outline-none transition-all focus:border-[var(--primary)]"
          style={inputStyle}
        >
          <option value="">{placeholder}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (field.type === "checkbox") {
    return (
      <FieldShell error={error}>
        <label
          className="flex h-[50px] items-center gap-3 rounded-2xl border px-4"
          style={inputStyle}
        >
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span className="text-sm">
            {field.label}
            {field.required ? " *" : ""}
          </span>
        </label>
      </FieldShell>
    );
  }

  return (
    <FieldShell error={error}>
      <input
        type={field.type}
        placeholder={placeholder}
        value={String(value || "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border px-4 py-3 outline-none transition-all focus:border-[var(--primary)]"
        style={inputStyle}
      />
    </FieldShell>
  );
}

function FieldShell({
  children,
  error,
  className = "",
}: {
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function StepHeader({ step }: { step: "form" | "otp" }) {
  return (
    <div className="mb-6 flex justify-center">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white">
          1
        </div>
        <div className="h-[2px] w-12 bg-[var(--border)]" />
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            step === "otp"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--background)]"
          }`}
        >
          2
        </div>
        <div className="h-[2px] w-12 bg-[var(--border)]" />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background)]">
          ✓
        </div>
      </div>
    </div>
  );
}

function LeadValuePanel() {
  return (
    <div
      className="relative hidden overflow-hidden rounded-[28px] border p-6 xl:block"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--border)" }}
    >
      <div className="relative z-10">
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{
            background: "rgba(101,188,79,0.12)",
            color: "var(--primary)",
          }}
        >
          Why Choose HPMC
        </span>
        <h2 className="mt-5 text-3xl font-bold leading-tight text-[var(--text-primary)]">
          Industrial Solutions
          <span className="block text-[var(--primary)]">You Can Trust</span>
        </h2>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">
          Share your requirements and our specialists will connect with you
          within 24 hours.
        </p>
        <div className="mt-8 space-y-3">
          {[
            "50+ Years of Experience",
            "1000+ Successful Installations",
            "ISO Certified Manufacturing",
            "Global Export Presence",
            "End-to-End Technical Support",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--sidebar-card)] p-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
                ✓
              </div>
              <span className="font-medium text-[var(--text-primary)]">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
