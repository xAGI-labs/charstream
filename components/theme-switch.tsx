"use client";

import React, { useEffect, useState } from "react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function ThemeSwitch() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setIsDarkMode(theme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? "light" : "dark";

    // Update the theme on the document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Save the theme in localStorage
    localStorage.setItem("theme", newTheme);

    // Update the local state
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      className="fixed w-[4rem] h-[2rem] bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center p-1 cursor-pointer shadow-2xl transition-all"
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
    >
      <div
        className={`w-[1.5rem] h-[1.5rem] bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center transition-transform ${
          isDarkMode ? "translate-x-[2rem]" : "translate-x-0"
        }`}
      >
        {isDarkMode ? <BsMoon /> : <BsSun />}
      </div>
    </button>
  );
}
