import { ThemeProvider } from "./components/theme-provider";
import { SettingsProvider } from "./context/SettingsContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <ThemeProvider> {children}</ThemeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
