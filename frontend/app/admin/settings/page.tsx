"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Save,
  Settings as SettingsIcon,
  ImageIcon,
  LayoutGrid,
} from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
interface SettingsData {
  branding: {
    companyName: string;
    logo: string;
  };
  modules: {
    leads: boolean;
    blogs: boolean;
    agents: boolean;
    employees: boolean;
    newsletter: boolean;
    subscribers: boolean;
    vendors: boolean;
    siteVisits: boolean;
    openings: boolean;
    jobApplications: boolean;
  };
}

const moduleList = [
  { key: "leads", label: "Leads" },
  { key: "blogs", label: "Blogs" },
  { key: "agents", label: "Agents" },
  { key: "employees", label: "Employees" },
  { key: "newsletter", label: "Newsletter" },
  { key: "subscribers", label: "Subscribers" },
  { key: "vendors", label: "Vendors" },
  { key: "siteVisits", label: "Site Visits" },
  { key: "openings", label: "Openings" },
  { key: "jobApplications", label: "Job Applications" },
];

export default function SettingsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [savingModules, setSavingModules] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [modules, setModules] = useState<Record<string, boolean>>({});
  const { refreshSettings } = useSettings();
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/settings`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setCompanyName(data.data.branding?.companyName || "");
        setLogoPreview(data.data.branding?.logo || "");
        setModules(data.data.modules || {});
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleBrandingSave = async () => {
    try {
      setSavingBranding(true);

      const formData = new FormData();

      formData.append("companyName", companyName);

      if (logo) {
        formData.append("logo", logo);
      }

      const res = await fetch(`${API_BASE}/api/settings/branding`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        await refreshSettings();
        await fetchSettings();
        alert("Branding updated successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update branding");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleModulesSave = async () => {
    try {
      setSavingModules(true);

      const res = await fetch(`${API_BASE}/api/settings/modules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modules),
      });

      const data = await res.json();

      if (data.success) {
        await refreshSettings();
        await fetchSettings();
        alert("Modules updated successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update modules");
    } finally {
      setSavingModules(false);
    }
  };

  const toggleModule = (key: string) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  const enabledModules = Object.values(modules).filter(Boolean).length;
  const disabledModules = Object.values(modules).filter((m) => !m).length;

  return (
    <div className="pb-24">
      {/* HEADER */}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[4px] text-[var(--primary)]">
            White Label CRM
          </p>

          <h1 className="font-serif text-4xl text-[var(--text-primary)]">
            Settings
          </h1>

          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage branding and module access for this CRM.
          </p>
        </div>
      </div>

      {/* STATS */}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Modules"
          value={moduleList.length}
          icon={<LayoutGrid size={18} />}
        />

        <StatCard
          title="Enabled"
          value={enabledModules}
          icon={<SettingsIcon size={18} />}
        />

        <StatCard
          title="Disabled"
          value={disabledModules}
          icon={<SettingsIcon size={18} />}
        />
      </div>

      {/* BRANDING */}

      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 flex items-center gap-3">
          <Building2 size={22} />
          <h2 className="text-xl font-semibold">Branding Settings</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Company Name
            </label>

            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-4 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Company Logo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  setLogo(file);

                  setLogoPreview(URL.createObjectURL(file));
                }
              }}
              className="w-full rounded-xl border border-[var(--border)] p-3"
            />
          </div>
        </div>

        {logoPreview && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">Logo Preview</p>

            <div className="flex h-32 w-48 items-center justify-center rounded-xl border border-[var(--border)] bg-white">
              <img
                src={logoPreview}
                alt="logo"
                className="max-h-24 max-w-40 object-contain"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleBrandingSave}
          disabled={savingBranding}
          className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-white"
        >
          <Save size={16} />
          {savingBranding ? "Saving..." : "Save Branding"}
        </button>
      </div>

      {/* MODULES */}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 flex items-center gap-3">
          <ImageIcon size={22} />
          <h2 className="text-xl font-semibold">Module Management</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {moduleList.map((module) => (
            <div
              key={module.key}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4"
            >
              <span className="font-medium">{module.label}</span>

              <button
                onClick={() => toggleModule(module.key)}
                className={`relative h-7 w-14 rounded-full transition ${
                  modules[module.key] ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition ${
                    modules[module.key] ? "left-7" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleModulesSave}
          disabled={savingModules}
          className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-white"
        >
          <Save size={16} />
          {savingModules ? "Saving..." : "Save Modules"}
        </button>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">{title}</span>
        {icon}
      </div>

      <h3 className="text-3xl font-bold">{value}</h3>
    </div>
  );
}
