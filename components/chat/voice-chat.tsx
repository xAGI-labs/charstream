"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle, ForwardedRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { FullscreenVoiceCall } from "./fullscreen-voice-call"

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
  characterName?: string;
  characterAvatarUrl?: string | null;
}

interface VoiceChatMethods {
  interruptAI: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleAutoListen: () => void; // Add this method
}

export const VoiceChat = forwardRef<VoiceChatMethods, VoiceChatProps>(({ 
  characterId, 
  onMessageSent, 
  disabled,
  isWaiting,
  onVoiceStateChange,
  onCallActiveChange,
  isUnhinged = false,
  characterName = "AI Assistant",
  characterAvatarUrl
}: VoiceChatProps, ref: ForwardedRef<VoiceChatMethods>) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [lastUserMessage, setLastUserMessage] = useState("")
  const [lastAIMessage, setLastAIMessage] = useState("")
  const [continuousMode, setContinuousMode] = useState(false)
  const [callActive, setCallActive] = useState(true)
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>("");
  const [liveAITranscript, setLiveAITranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [earlyTranscript, setEarlyTranscript] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [autoListen, setAutoListen] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const { userId } = useAuth()
  
  // Add state for tracking in-flight API requests
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  // Add ref to track the last processed audio hash
  const lastProcessedAudioRef = useRef<string | null>(null);
  
  // Add a request timestamp ref to prevent duplicate requests in quick succession
  const lastRequestTimeRef = useRef<number>(0);
  
  const audioProcessedRef = useRef<boolean>(false);
  
  useEffect(() => {
    console.log("Voice mode activated - starting call automatically");
    if (onCallActiveChange) onCallActiveChange(true);
    
    const timer = setTimeout(() => {
      if (!isRecording && !isProcessing && !isResponding) {
        startRecording();
      }
    }, 600);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log("VoiceChat props:", { 
      characterId, 
      disabled, 
      callActive,
      isWaiting, 
      continuousMode, 
      isUnhinged,
      characterName
    })
  }, [characterId, disabled, isWaiting, continuousMode, callActive, isUnhinged, characterName])
  
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
    if (autoListen && continuousMode && callActive && !isResponding && !isRecording && !isProcessing && !isMuted) {
      const timer = setTimeout(() => {
        if (callActive) {
          startRecording();
        }
      }, 1000); // Small delay before starting to record again
      
      return () => clearTimeout(timer);
    }
  }, [isResponding, isRecording, isProcessing, continuousMode, callActive, isMuted, autoListen]);
  
  const startRecording = async () => {
    // Additional logging to help debug
    console.log("startRecording called, current states:", {
      isRecording,
      isProcessing,
      isResponding,
      isMuted
    });
    
    // Don't start recording if already recording or if in another state that prevents recording
    if (isRecording || isProcessing || isResponding) {
      console.log("Cannot start recording - already in another state");
      return;
    }
    
    // Don't start recording if muted
    if (isMuted) {
      console.log("Microphone is muted, not starting recording");
      return;
    }
    
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
      
      // Create media recorder with error handling
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn("audio/webm not supported, trying audio/ogg");
        mimeType = 'audio/ogg';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.warn("audio/ogg not supported, trying default");
          mimeType = '';
        }
      }
      
      console.log(`Using mime type: ${mimeType || 'browser default'}`);
      
      const mediaRecorder = mimeType ? 
        new MediaRecorder(stream, { mimeType }) : 
        new MediaRecorder(stream);
        
      mediaRecorderRef.current = mediaRecorder
      
      // Store the active stream for later cleanup
      const streamRef = stream;
      
      // Reset the audio processed flag when starting a new recording
      audioProcessedRef.current = false;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        console.log("Received audio data chunk of size:", event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        console.log("Recording stopped, processing audio chunks");
        
        if (audioChunksRef.current.length === 0) {
          console.error("No audio chunks recorded");
          toast.error("No audio was recorded", {
            description: "Please try again and speak clearly"
          });
          setIsProcessing(false);
          return;
        }
        
        console.log(`Captured ${audioChunksRef.current.length} audio chunks`);
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        console.log("Audio blob created, size:", audioBlob.size);
        
        // Stop all tracks in the stream
        streamRef.getTracks().forEach(track => track.stop());
        
        // Process the audio only if it hasn't been processed yet
        if (!audioProcessedRef.current) {
          audioProcessedRef.current = true;
          processAudio(audioBlob);
        } else {
          console.log("Audio already processed, skipping duplicate processing");
        }
      };
      
      // Start recording with explicit timeout to ensure it completes
      console.log("Starting MediaRecorder...");
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start recording timer
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      console.log("Recording started successfully");
      
    } catch (error: unknown) {
      console.error("Error starting recording:", error);
      const errorMessage = error instanceof Error  
        ? error.message
        : "Unknown error";
      
      toast.error("Could not access microphone", {
        description: errorMessage
      });
    }
  }
  
  // Stop recording function with debounce protection
  const stopRecording = () => {
    // Log event with timestamp for debugging
    console.log(`⏱️ STOP RECORDING CALLED AT ${new Date().toISOString()}`);
    
    // Prevent multiple calls to stopRecording within a short time window
    const now = Date.now();
    if (now - lastRequestTimeRef.current < 1000) { // 1 second debounce
      console.log("🛑 Ignoring duplicate stopRecording call - too soon after previous call");
      return;
    }
    
    // Update the last request time
    lastRequestTimeRef.current = now;
    
    try {
      // Always force stop the recording state first
      setIsRecording(false);
      setIsProcessing(true);
      
      // Clear any active timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Process the recorder if it exists
      if (mediaRecorderRef.current) {
        try {
          // Try to get any final data
          if (mediaRecorderRef.current.state === 'recording') {
            try {
              mediaRecorderRef.current.requestData();
              console.log("Requested final data chunk");
            } catch (e) {
              console.error("Error requesting final data:", e);
            }
            
            try {
              mediaRecorderRef.current.stop();
              console.log("✅ MediaRecorder successfully stopped");
              // The onstop event will handle processing
            } catch (e) {
              console.error("Failed to stop recorder:", e);
            }
          } else {
            console.log("MediaRecorder not in recording state:", mediaRecorderRef.current.state);
          }
        } catch (e) {
          console.error("Error handling recorder:", e);
        }
        
        // EMERGENCY FALLBACK: Only process manually if the onstop event hasn't fired after a delay
        setTimeout(() => {
          if (!audioProcessedRef.current && audioChunksRef.current.length > 0) {
            console.log("Emergency fallback: Processing audio chunks after timeout");
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log(`Created audio blob: ${audioBlob.size} bytes`);
            audioProcessedRef.current = true;
            processAudio(audioBlob);
          } else if (!audioProcessedRef.current) {
            console.error("No audio chunks to process and onstop didn't fire");
            setIsProcessing(false);
            toast.error("No audio was recorded");
          } else {
            console.log("Audio already processed by onstop event, fallback not needed");
          }
        }, 1000); // Longer timeout to give onstop event a chance to fire
      } else {
        console.warn("No media recorder found");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error in stopRecording:", error);
      setIsProcessing(false);
      toast.error("Error stopping recording");
    }
  };
  
  // Add a function to generate a simple audio hash for deduplication
  const generateAudioHash = (audioBlob: Blob): string => {
    return `${characterId}_${audioBlob.size}_${Date.now()}`;
  };
  
  // Process audio function with duplicate detection
  const processAudio = async (audioBlob: Blob) => {
    // Generate a hash for this audio processing request
    const audioHash = generateAudioHash(audioBlob);
    
    // Log values for debugging
    console.log("processAudio called with blob:", {
      size: audioBlob.size,
      type: audioBlob.type,
      userId,
      characterId,
      audioHash: audioHash.substring(0, 20) + "..."
    });
    
    // Check if we're already processing a request
    if (isProcessingAudio) {
      console.log("⚠️ Already processing an audio request, ignoring this one");
      toast.warning("Processing in progress", {
        description: "Please wait for the current processing to complete"
      });
      setIsProcessing(false);
      return;
    }
    
    // Check if this is the same audio we just processed (simple hash check)
    if (lastProcessedAudioRef.current && 
        lastProcessedAudioRef.current.startsWith(`${characterId}_${audioBlob.size}`)) {
      console.log("⚠️ Duplicate audio detected, ignoring");
      toast.warning("Duplicate request", {
        description: "This appears to be a duplicate request"
      });
      setIsProcessing(false);
      return;
    }
    
    // Update state to indicate processing
    setIsProcessingAudio(true);
    lastProcessedAudioRef.current = audioHash;
    
    if (!userId) {
      toast.error("You need to be signed in", {
        description: "Please sign in to use voice chat"
      });
      setIsProcessing(false);
      return;
    }
    
    if (!characterId) {
      console.error("Missing characterId in VoiceChat component");
      toast.error("Character information missing", {
        description: "Please refresh the page or try a different character"
      });
      setIsProcessing(false);
      return;
    }
    
    if (audioBlob.size === 0) {
      console.error("Empty audio blob");
      toast.error("No audio recorded", {
        description: "Please try again and speak clearly"
      });
      setIsProcessing(false);
      return;
    }
    
    try {
      console.log("Processing audio blob, size:", audioBlob.size);
      setIsProcessing(true);
      
      // Create form data to send to API
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'recording.webm');
      formData.append('character_id', characterId);
      formData.append('is_unhinged', isUnhinged.toString());
      
      // Log that we're about to send the request
      console.log(`Sending request to /api/voice/process with form data:`, {
        'audio_file': `Blob of ${audioBlob.size} bytes`,
        'character_id': characterId,
        'is_unhinged': isUnhinged
      });
      
      // Call our API endpoint with a timeout to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/voice/process', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log(`API Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(errorText || response.statusText);
        }
        
        const data = await response.json();
        console.log("Voice API response:", data);
        
        // Update last messages for display UI only
        if (data.user_text) {
          setLastUserMessage(data.user_text);
          setLiveUserTranscript(data.user_text);
        }
        
        // Update AI message as soon as it's available
        if (data.ai_text) {
          let cleanedResponse = data.ai_text;
          // Remove any "*As character*:" prefix if present
          if (cleanedResponse.includes('*As ') && cleanedResponse.includes('*:')) {
            cleanedResponse = cleanedResponse.replace(/\*As [^*]+\*:\s*/, '');
          }
          setLastAIMessage(cleanedResponse);
          setLiveAITranscript(cleanedResponse);
          
          // Refresh messages to show the AI response in the chat history immediately
          await onMessageSent("__REFRESH_MESSAGES__");
          
          // Processing is complete, even though we're still waiting for audio
          setIsProcessing(false);
        }
        
        // Play audio response if available
        if (data.audio_data) {
          console.log("Playing audio response");
          setIsResponding(true);
          
          const responseAudio = new Audio(data.audio_data);
          audioPlayerRef.current = responseAudio;
          
          // When audio ends, reset responding state and trigger refresh
          responseAudio.addEventListener('ended', async () => {
            setIsResponding(false);
            audioPlayerRef.current = null;
            
            // After audio finishes playing, ensure messages are refreshed
            try {
              console.log("Voice response ended, refreshing messages");
              await onMessageSent("__REFRESH_MESSAGES__");
            } catch (refreshError) {
              console.error("Error refreshing messages after voice response:", refreshError);
            }
          });
          
          responseAudio.play();
          
          // Also initiate an immediate refresh to ensure the database message is captured
          if (data.conversation_id) {
            try {
              // Slight delay to ensure database writes are completed
              setTimeout(async () => {
                await onMessageSent("__REFRESH_MESSAGES__");
              }, 500);
            } catch (error) {
              console.error("Error triggering message refresh:", error);
            }
          }
        } else {
          console.error("No audio data in response");
          setIsProcessing(false);
          throw new Error("No audio response received");
        }
        
      } catch (fetchError: unknown) {
        console.error("Fetch error:", fetchError);
        if (fetchError && 
            typeof fetchError === 'object' && 
            'name' in fetchError && 
            fetchError.name === 'AbortError') {
          throw new Error("Request timed out - server took too long to respond");
        }
        throw fetchError;
      } finally {
        // Always reset the processing state after completion or error
        setIsProcessingAudio(false);
      }
    } catch (error: unknown) {
      console.error("Error processing audio:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Please try again";
      toast.error("Error processing voice", {
        description: errorMessage
      });
      setIsProcessing(false);
      setIsResponding(false);
    }
  }
  
  const interruptAI = () => {
    // Stop the audio playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsResponding(false);
      
      // Small delay before starting to record again
      setTimeout(() => {
        if (callActive && !isMuted && autoListen) {
          startRecording();
        }
      }, 300);
    }
  }
  
  // Add toggle auto listen function
  const toggleAutoListen = () => {
    console.log(`Toggling auto-listen from ${autoListen} to ${!autoListen}`);
    setAutoListen(!autoListen);
    
    // Notify user of the change
    toast.info(autoListen ? "Auto-listening disabled" : "Auto-listening enabled", {
      description: autoListen 
        ? "You need to click the mic button to speak" 
        : "Microphone will activate automatically after AI responds"
    });
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted) {
      // Currently not muted, going to mute
      if (isRecording) {
        // Stop recording if active
        stopRecording();
      }
      toast.info("Microphone muted");
    } else {
      // Currently muted, going to unmute
      toast.info("Microphone unmuted");
      if (callActive && !isProcessing && !isResponding && autoListen) {
        // Start recording if call is active and we're not busy
        startRecording();
      }
    }
  }
  
  const endCall = () => {
    console.log("Ending call...");
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
    endCall,
    toggleMute,
    toggleAutoListen
  }));
  
  // Clean up on component unmount or when mode changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      
      // Reset states
      setIsRecording(false);
      setIsProcessing(false);
      setIsResponding(false);
      setCallActive(false);
    }
  }, []);
  
  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // When in voice mode, always show the fullscreen interface
  return (
    <div className="flex-1 flex items-center justify-center w-full h-screen">
      <FullscreenVoiceCall
        isActive={true}
        characterName={characterName}
        characterAvatarUrl={characterAvatarUrl}
        isRecording={isRecording}
        isProcessing={isProcessing}
        isResponding={isResponding}
        isMuted={isMuted}
        recordingTime={recordingTime}
        userMessage={liveUserTranscript}
        aiMessage={liveAITranscript}
        onMuteToggle={toggleMute}
        onEndCall={endCall}
        onInterrupt={interruptAI}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        autoListen={autoListen}
        onAutoListenToggle={toggleAutoListen}
      />
    </div>
  );
});

VoiceChat.displayName = "VoiceChat";
