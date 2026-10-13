import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // The public site is intentionally light-only. A switchable provider can
    // still opt into the previous preference-based behavior for isolated tools.
    if (!switchable) return "light";
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const activeTheme: Theme = switchable ? theme : "light";

    root.classList.toggle("dark", activeTheme === "dark");
    root.style.colorScheme = activeTheme;

    if (switchable) {
      localStorage.setItem("theme", activeTheme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme: switchable ? theme : "light", toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
