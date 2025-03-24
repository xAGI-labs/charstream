export async function transcribeAudio(audioBlob: Blob): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_OPEN_AI_KEY || process.env.OPEN_AI_KEY;

  if (!apiKey) {
    console.error("OpenAI API key is missing. Please set it in the environment variables.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("response_format", "json");
  formData.append("temperature", "0.2"); // Lower temperature for more deterministic results

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.text.trim(); // Trim whitespace for cleaner results
    } else {
      const errorText = await response.text();
      console.error("Transcription failed:", errorText);
      return null;
    }
  } catch (error) {
    console.error("Error in transcribe function:", error);
    return null;
  }
}
