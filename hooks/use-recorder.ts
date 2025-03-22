import { useState } from "react";

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    return new Promise<Blob>((resolve) => {
      if (mediaRecorder) {
        mediaRecorder.ondataavailable = (event) => resolve(event.data);
        mediaRecorder.stop();
        setIsRecording(false);
      }
    });
  };

  return { isRecording, startRecording, stopRecording };
}
