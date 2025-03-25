"use client";

import { useTheme } from "@/context/theme-context";
import React from "react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="fixed w-[4rem] h-[2rem] bg-gray-300 dark:bg-neutral-600 rounded-full flex items-center p-1 cursor-pointer shadow-2xl transition-all"
      onClick={toggleTheme}
    >
      <div
        className={`w-[1.5rem] h-[1.5rem] bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center transition-transform ${
          theme === "light" ? "translate-x-0" : "translate-x-[2rem]"
        }`}
      >
        {theme === "light" ? <BsMoon /> : <BsSun />}
      </div>
    </div>
  );
}
