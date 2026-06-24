"use client";

import Image from "next/image";
import Link from "next/link";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

import { useEffect, useState } from "react";

import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./Theme-toggle";
import PopupForm from "./Popup";
import { usePathname } from "next/navigation";
import { useSettings } from "../context/SettingsContext";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            autoDisplay?: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(0);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [mobileProduct, setMobileProduct] = useState(false);
  const [mobileContact, setMobileContact] = useState(false);

  const [openMobileCategory, setOpenMobileCategory] = useState<number | null>(
    null,
  );
  const [openPopup, setOpenPopup] = useState(false);

  const [mobileCompany, setMobileCompany] = useState(false);
  const [mobileService, setMobileService] = useState(false);
  const pathname = usePathname();
  const { settings, loading } = useSettings();

  useEffect(() => {
    const googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    const loadGoogleTranslateScript = () => {
      if (!window.googleTranslateElementInit) {
        const script = document.createElement("script");

        script.src =
          "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

        script.async = true;

        document.body.appendChild(script);

        window.googleTranslateElementInit = googleTranslateElementInit;
      }
    };

    loadGoogleTranslateScript();
  }, []);
  const logoUrl = settings?.branding?.logo || "/logo.png";

  return (
    <>
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-[72px]">
            {/* LOGO */}
            <Link href="/">
              <Image
                src={logoUrl}
                alt="logo"
                width={140}
                height={100}
                className="object-contain"
              />
            </Link>

            {/* DESKTOP MENU */}
            <nav className="hidden lg:flex items-center gap-7 h-full">
              {/* GALLERY */}
              {/* <Link
                href="/gallery"
                className={`relative h-full flex items-center text-[14px] uppercase font-semibold tracking-wide transition ${
                  pathname === "/gallery"
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-primary)] hover:text-[var(--primary)]"
                }`}
              >
                Gallery
                {pathname === "/gallery" && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--primary)] rounded-full" />
                )}
              </Link> */}
            </nav>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
              <div className="notranslate">
                <LanguageSelector />
              </div>

              <ThemeToggle />

              {/* MOBILE BUTTON */}
              <button
                onClick={() => setMobileMenu(true)}
                className="lg:hidden text-[var(--text-primary)]"
              >
                <Menu size={32} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed top-0 right-0 h-screen w-full bg-[var(--background)] z-[100] transition-all duration-300 lg:hidden overflow-hidden ${
          mobileMenu ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          {/* TOP */}
          <div className="flex items-center justify-between pb-5">
            <Image
              src={logoUrl}
              alt="logo"
              width={40}
              height={40}
              className="object-contain"
            />

            <button onClick={() => setMobileMenu(false)}>
              <X size={30} className="text-[var(--text-primary)]" />
            </button>
          </div>

          {/* MENU */}
          <div className="flex flex-col mt-8">
            {/* <Link
              href="/gallery"
              className="py-4 text-[var(--text-primary)] font-semibold uppercase text-sm"
            >
              Gallery
            </Link> */}

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setOpenPopup(true)}
              className="mt-8 flex items-center justify-center gap-4 border-2 border-[var(--primary)] rounded-full py-2 group"
            >
              <span className="text-[14px] uppercase font-semibold text-[var(--text-primary)]">
                Get A Quote
              </span>

              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <span className="text-white text-lg">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      <PopupForm open={openPopup} onClose={() => setOpenPopup(false)} />
    </>
  );
}
