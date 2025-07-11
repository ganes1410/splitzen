import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function ThemeToggle() {
  // const [theme, setTheme] = useState(() => {
  //   // const savedTheme = localStorage.getItem('theme')
  //   const savedTheme = ""; // Placeholder for localStorage retrieval
  //   if (savedTheme) {
  //     return savedTheme;
  //   } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  //     return "light";
  //   } else {
  //     return "dark";
  //   }
  // });
  const [theme, setTheme] = useState("light"); // Placeholder for initial theme state

  // useEffect(() => {
  //   document.documentElement.classList.remove('light', 'dark')
  //   document.documentElement.classList.add(theme)
  //   localStorage.setItem('theme', theme)
  // }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return <Button onClick={toggleTheme}>Toggle Theme ({theme})</Button>;
}
