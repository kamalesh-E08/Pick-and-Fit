"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { speechService } from "@/lib/services/speech-service";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onListeningChange,
  disabled = false,
  placeholder = "Click to start speaking...",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [volume, setVolume] = useState(0);
  const listenTimeoutRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number>();

  // Check browser support
  useEffect(() => {
    const supported = speechService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      console.warn("Speech Recognition not supported in this browser");
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Monitor audio volume
  const monitorVolume = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      source.connect(analyserRef.current);

      const updateVolume = () => {
        if (analyserRef.current && isListening) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount,
          );
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(Math.min(100, (average / 255) * 100));
          animationIdRef.current = requestAnimationFrame(updateVolume);
        }
      };

      updateVolume();
    } catch (error) {
      console.log("Microphone access not available");
    }
  };

  const startListening = async () => {
    if (!isSupported || disabled) return;

    try {
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");
      onListeningChange?.(true);

      // Start monitoring volume
      monitorVolume();

      // Auto-stop after 30 seconds
      listenTimeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);

      await speechService.startListening(
        (transcriptData) => {
          setInterimTranscript(
            transcriptData.isFinal ? "" : transcriptData.text,
          );
          if (transcriptData.isFinal) {
            setTranscript((prev) => {
              const newTranscript = (prev + " " + transcriptData.text).trim();
              return newTranscript;
            });
          }

          if (transcriptData.confidence && transcriptData.confidence < 0.5) {
            toast.warning("Low confidence - please repeat");
          }
        },
        (error) => {
          toast.error(`Voice input error: ${error}`);
          setIsListening(false);
          onListeningChange?.(false);
        },
        () => {
          // On start
        },
      );

      setIsListening(false);
      onListeningChange?.(false);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to start listening";
      toast.error(errorMsg);
      setIsListening(false);
      onListeningChange?.(false);
    } finally {
      if (listenTimeoutRef.current) {
        clearTimeout(listenTimeoutRef.current);
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    onListeningChange?.(false);
    setVolume(0);

    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
    }
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
    onTranscript("");
  };

  if (!isSupported) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Speech Recognition is not supported in your browser. Please use
          Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Transcript Display */}
      {transcript && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">You said: </span>
            {transcript}
            {interimTranscript && (
              <span className="text-gray-400 italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Volume Indicator */}
      {isListening && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-600" />
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100"
                style={{ width: `${volume}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{Math.round(volume)}%</span>
          </div>
          <p className="text-xs text-center text-green-600 font-semibold animate-pulse">
            Listening... (auto-stops in 30s)
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        {!isListening ? (
          <Button
            onClick={startListening}
            disabled={disabled}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Voice Input
          </Button>
        ) : (
          <Button
            onClick={stopListening}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <MicOff className="w-4 h-4 mr-2" />
            Stop Listening
          </Button>
        )}

        {transcript && (
          <Button onClick={clearTranscript} variant="outline" className="px-4">
            Clear
          </Button>
        )}
      </div>

      {/* Interim Transcript */}
      {interimTranscript && !transcript && (
        <p className="text-xs text-gray-500 italic text-center">
          Interim: {interimTranscript}
        </p>
      )}
    </div>
  );
};

export default VoiceInput;
