"use client";

import { useTheme } from "@/context/theme-context";
import React from "react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="fixed bg-white w-[3rem] mb-4 h-[3rem] bg-opacity-80 backdrop-blur-[0.5rem]  shadow-2xl rounded-full flex items-center justify-center cursor-pointer transition-all dark:bg-neutral-800"
      onClick={toggleTheme}
    >
      {theme === "light" ? <BsSun /> : <BsMoon />}
    </button>
  );
}