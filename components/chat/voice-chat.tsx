"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, ForwardedRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, Volume2, PhoneOff, Repeat } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface VoiceChatProps {
  characterId: string;
  onMessageSent: (content: string, isUserMessage?: boolean) => Promise<void>;
  disabled: boolean;
  isWaiting: boolean;
  onVoiceStateChange?: (
    isRecording: boolean, 
    isProcessing: boolean, 
    isResponding: boolean,
    recordingTime?: number,
    userMessage?: string,
    aiMessage?: string
  ) => void;
  onCallActiveChange?: (active: boolean) => void;
  isUnhinged?: boolean;
}

interface VoiceChatMethods {
  interruptAI: () => void;
  endCall: () => void;
}

export const VoiceChat = forwardRef<VoiceChatMethods, VoiceChatProps>(({ 
  characterId, 
  onMessageSent, 
  disabled,
  isWaiting,
  onVoiceStateChange,
  onCallActiveChange,
  isUnhinged = false
}: VoiceChatProps, ref: ForwardedRef<VoiceChatMethods>) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [lastUserMessage, setLastUserMessage] = useState("")
  const [lastAIMessage, setLastAIMessage] = useState("")
  const [continuousMode, setContinuousMode] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>("");
  const [liveAITranscript, setLiveAITranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [earlyTranscript, setEarlyTranscript] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const { userId } = useAuth()

  // Debug information
  useEffect(() => {
    console.log("VoiceChat props:", { 
      characterId, 
      disabled, 
      isWaiting, 
      continuousMode, 
      callActive,
      isUnhinged // Log the isUnhinged state
    })
  }, [characterId, disabled, isWaiting, continuousMode, callActive, isUnhinged])

  // Update the parent component with state changes
  useEffect(() => {
    if (onVoiceStateChange) {
      onVoiceStateChange(
        isRecording, 
        isProcessing, 
        isResponding,
        recordingTime,
        lastUserMessage,
        lastAIMessage
      );
    }
  }, [isRecording, isProcessing, isResponding, recordingTime, lastUserMessage, lastAIMessage, onVoiceStateChange]);

  // After responding finishes in continuous mode, start recording again
  useEffect(() => {
    if (continuousMode && callActive && !isResponding && !isRecording && !isProcessing) {
      const timer = setTimeout(() => {
        if (callActive) {
          startRecording();
        }
      }, 1000); // Small delay before starting to record again
      
      return () => clearTimeout(timer);
    }
  }, [isResponding, isRecording, isProcessing, continuousMode, callActive]);

  const startRecording = async () => {
    try {
      console.log("Starting voice recording...")
      
      // Reset state
      audioChunksRef.current = []
      setRecordingTime(0)
      
      // Request microphone access
      console.log("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      console.log("Microphone access granted")
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // Most compatible format for OpenAI
      })
      mediaRecorderRef.current = mediaRecorder
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("Received audio data chunk of size:", event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log("Recording stopped")
        console.log("Number of audio chunks:", audioChunksRef.current.length)
        
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio was recorded", {
            description: "Please try again and speak clearly"
          })
          return
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log("Audio blob created, size:", audioBlob.size)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
        
        // Process the audio
        processAudio(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      
      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      console.log("Recording started successfully")
      
    } catch (error: unknown) {
      console.error("Error starting recording:", error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Unknown error";
      
      toast.error("Could not access microphone", {
        description: errorMessage
      })
    }
  }
  
  const stopRecording = () => {
    console.log("Stopping recording...")
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      // Show transcribing state immediately
      setIsTranscribing(true);
    } else {
      console.warn("No active recording to stop")
    }
  }
  
  const processAudio = async (audioBlob: Blob) => {
    // Log values for debugging
    console.log("Processing audio with:", {
      userId: userId,
      characterId: characterId,
      blobSize: audioBlob.size
    });
    
    if (!userId) {
      toast.error("You need to be signed in", {
        description: "Please sign in to use voice chat"
      });
      return;
    }
    
    if (!characterId) {
      console.error("Missing characterId in VoiceChat component");
      toast.error("Character information missing", {
        description: "Please refresh the page or try a different character"
      });
      return;
    }
    
    try {
      console.log("Processing audio blob, size:", audioBlob.size)
      setIsProcessing(true)
      
      // Do early transcription to show user input immediately
      try {
        setIsTranscribing(true);
        const { transcribeAudio } = await import('@/lib/openai');
        const transcript = await transcribeAudio(audioBlob);
        
        if (transcript) {
          console.log("Early transcript:", transcript);
          setEarlyTranscript(transcript);
          setLastUserMessage(transcript);
          setLiveUserTranscript(transcript);
          setIsTranscribing(false);
        }
      } catch (transcriptError) {
        console.error("Error with early transcription:", transcriptError);
        setIsTranscribing(false);
      }
      
      // Create form data to send to API
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.webm')
      formData.append('character_id', characterId)
      formData.append('is_unhinged', isUnhinged.toString())
      
      // Add debug log to confirm the unhinged state being sent
      console.log(`Sending audio to API for processing (characterId: ${characterId}, unhinged: ${isUnhinged})...`)
      
      // Call our API endpoint
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(errorText || response.statusText)
      }
      
      const data = await response.json()
      console.log("Voice API response:", data)
      
      // Update last messages for display UI only if not already set by early transcription
      if (data.user_text && !lastUserMessage) {
        setLastUserMessage(data.user_text)
        setLiveUserTranscript(data.user_text);
      }
      
      // Update AI message as soon as it's available
      if (data.ai_text) {
        let cleanedResponse = data.ai_text
        // Remove any "*As character*:" prefix if present
        if (cleanedResponse.includes('*As ') && cleanedResponse.includes('*:')) {
          cleanedResponse = cleanedResponse.replace(/\*As [^*]+\*:\s*/, '')
        }
        setLastAIMessage(cleanedResponse)
        setLiveAITranscript(cleanedResponse);
        
        // Refresh messages to show the AI response in the chat history immediately
        await onMessageSent("__REFRESH_MESSAGES__")
        
        // Processing is complete, even though we're still waiting for audio
        setIsProcessing(false)
      }
      
      // Play audio response if available
      if (data.audio_data) {
        console.log("Playing audio response")
        setIsResponding(true)
        
        const responseAudio = new Audio(data.audio_data)
        audioPlayerRef.current = responseAudio
        
        // When audio ends, reset responding state and trigger refresh
        responseAudio.addEventListener('ended', async () => {
          setIsResponding(false)
          audioPlayerRef.current = null
          
          // After audio finishes playing, ensure messages are refreshed
          try {
            console.log("Voice response ended, refreshing messages")
            await onMessageSent("__REFRESH_MESSAGES__")
          } catch (refreshError) {
            console.error("Error refreshing messages after voice response:", refreshError)
          }
        })
        
        responseAudio.play()
      } else {
        console.error("No audio data in response")
        setIsProcessing(false)
        throw new Error("No audio response received")
      }
      
    } catch (error: unknown) {
      console.error("Error processing audio:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Please try again"
      toast.error("Error processing voice", {
        description: errorMessage
      })
      setIsProcessing(false)
      setIsResponding(false)
    }
  }
  
  const interruptAI = () => {
    // Stop the audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsResponding(false);
      
      // Small delay before starting to record
      setTimeout(() => {
        if (callActive) {
          startRecording();
        }
      }, 300);
    }
  }
  
  const startCall = () => {
    setCallActive(true);
    if (onCallActiveChange) onCallActiveChange(true);
    startRecording();
  }
  
  const endCall = () => {
    setCallActive(false);
    if (onCallActiveChange) onCallActiveChange(false);
    
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Stop audio if playing
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    
    // Reset states
    setIsRecording(false);
    setIsProcessing(false);
    setIsResponding(false);
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  
  // Expose methods via useImperativeHandle
  useImperativeHandle(ref, () => ({
    interruptAI,
    endCall
  }));
  
  // Clean up on component unmount or when mode changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      
      // Reset states
      setIsRecording(false)
      setIsProcessing(false)
      setIsResponding(false)
      setCallActive(false)
    }
  }, [])
  
  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex items-center gap-2 mb-4">
        <Switch
          id="continuous-mode"
          checked={continuousMode}
          onCheckedChange={setContinuousMode}
          disabled={isRecording || isProcessing || isResponding}
        />
        <Label htmlFor="continuous-mode" className="text-sm">
          Continuous conversation
        </Label>
      </div>
      
      {!callActive ? (
        // Start call button
        <Button
          type="button"
          onClick={startCall}
          disabled={disabled || isWaiting}
          className={cn(
            "rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white",
            (disabled || isWaiting) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Mic className="h-6 w-6" />
        </Button>
      ) : (
        // Active call UI
        <div className="flex flex-col items-center">
          {isRecording ? (
            // Recording state
            <div className="flex flex-col items-center">
              <div className="text-sm font-medium mb-2 text-red-500">
                {formatTime(recordingTime)}
              </div>
              <Button
                type="button"
                onClick={stopRecording}
                className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white"
              >
                <Square className="h-6 w-6" />
              </Button>
            </div>
          ) : isTranscribing ? (
            // Transcribing state (new)
            <Button
              type="button"
              disabled={true}
              className="rounded-full h-14 w-14 bg-yellow-500 opacity-70 cursor-not-allowed"
            >
              <Loader2 className="h-6 w-6 animate-spin" />
            </Button>
          ) : isProcessing ? (
            // Processing state
            <Button
              type="button"
              disabled={true}
              className="rounded-full h-14 w-14 bg-primary opacity-70 cursor-not-allowed"
            >
              <Loader2 className="h-6 w-6 animate-spin" />
            </Button>
          ) : isResponding ? (
            // AI speaking state - interrupt option
            <Button
              type="button"
              onClick={interruptAI}
              className="rounded-full h-14 w-14 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Volume2 className="h-6 w-6" />
            </Button>
          ) : (
            // Default active call state - start recording again
            <Button
              type="button"
              onClick={startRecording}
              className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 text-white"
            >
              <Repeat className="h-6 w-6" />
            </Button>
          )}
          
          {/* End call button */}
          <Button
            type="button"
            onClick={endCall}
            className="rounded-full h-10 w-10 bg-red-500 hover:bg-red-600 text-white mt-3"
            title="End call"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="mt-3 text-sm text-muted-foreground text-center">
        {!callActive ? (
          "Click to start voice call"
        ) : isRecording ? (
          "Recording... Click to stop"
        ) : isTranscribing ? (
          "Transcribing your speech..."
        ) : isProcessing ? (
          "Processing your message..."
        ) : isResponding ? (
          "AI is speaking... Click to interrupt"
        ) : (
          "Ready for your next message"
        )}
      </div>
    </div>
  );
});

VoiceChat.displayName = "VoiceChat";
