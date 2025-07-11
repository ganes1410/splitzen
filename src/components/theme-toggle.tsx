import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    // Default to light theme for SSR, then hydrate on client
    if (typeof window === "undefined") {
      return "light";
    }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    } else {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return <Button onClick={toggleTheme}>Toggle Theme ({theme})</Button>;
}
