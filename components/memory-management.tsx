"use client";

import { useState } from "react";
import { toast } from "sonner";

export function MemoryManagement({ characterId }: { characterId: string }) {
  const [memory, setMemory] = useState<string>("");

  const handleSave = async () => {
    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, content: memory }),
      });

      if (!response.ok) throw new Error("Failed to save memory");

      toast.success("Memory saved successfully");
      setMemory("");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to save memory");
      } else {
        toast.error("An unknown error occurred while saving memory.");
      }
    }
  };

  return (
    <div>
      <textarea
        value={memory}
        onChange={(e) => setMemory(e.target.value)}
        placeholder="Add memory for this character..."
        className="w-full p-2 border rounded"
      />
      <button onClick={handleSave} className="mt-2 btn btn-primary">
        Save Memory
      </button>
    </div>
  );
}
