export async function transcribeAudio(audioBlob: Blob): Promise<string | null> {
  const apiKey = process.env.OPEN_AI_KEY;

  if (!apiKey) {
    console.error("OpenAI API key is missing. Please set it in the environment variables.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (response.ok) {
    const data = await response.json();
    return data.text;
  } else {
    console.error("Transcription failed:", await response.text());
    return null;
  }
}
