/**
 * Speech Service
 * Handles voice-to-text conversion using Web Speech API (free)
 * with optional Google Cloud Speech-to-Text integration
 */

export interface SpeechRecognitionConfig {
  language?: string;
  continuousMode?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceTranscript {
  text: string;
  isFinal: boolean;
  confidence?: number;
  alternatives?: string[];
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private config: SpeechRecognitionConfig;
  private currentTranscript: string = "";
  private interimTranscript: string = "";
  private onErrorCallback?: (error: string) => void;

  constructor(config?: SpeechRecognitionConfig) {
    this.config = {
      language: config?.language || "en-US",
      continuousMode: config?.continuousMode || false,
      interimResults: config?.interimResults ?? true,
      maxAlternatives: config?.maxAlternatives || 1,
    };

    this.initializeWebSpeechAPI();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeWebSpeechAPI(): void {
    if (typeof window === "undefined") {
      console.log("Speech API not available in non-browser environment");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognitionListeners();
  }

  /**
   * Setup event listeners for speech recognition
   */
  private setupRecognitionListeners(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuousMode;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
      this.isListening = true;
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      this.isListening = false;

      if (!this.currentTranscript && !this.interimTranscript) {
        this.onErrorCallback?.("No speech detected. Please try again.");
      }
    };

    this.recognition.onerror = (event: any) => {
      const error = event?.error as string | undefined;
      if (error === "no-speech" || error === "aborted") {
        console.warn("Speech recognition warning:", error);
        if (error === "no-speech") {
          this.onErrorCallback?.("No speech detected. Please try again.");
        }
        return;
      }

      console.error("Speech recognition error:", error || event);
      this.onErrorCallback?.(error || "Speech recognition error");
    };
  }

  /**
   * Start listening for voice input
   */
  startListening(
    onTranscript?: (transcript: VoiceTranscript) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.onErrorCallback = onError;
      if (!this.recognition) {
        const error = "Speech Recognition API not available";
        console.error(error);
        onError?.(error);
        reject(error);
        return;
      }

      this.currentTranscript = "";
      this.interimTranscript = "";

      // Custom onresult handler
      this.recognition.onresult = (event: any) => {
        this.interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            this.currentTranscript += transcript + " ";
          } else {
            this.interimTranscript += transcript;
          }
        }

        const fullTranscript = (
          this.currentTranscript + this.interimTranscript
        ).trim();

        // Get alternatives if available
        const alternatives = [];
        if (event.results[event.results.length - 1]) {
          const results = event.results[event.results.length - 1];
          for (
            let i = 1;
            i < Math.min(results.length, this.config.maxAlternatives || 1);
            i++
          ) {
            alternatives.push(results[i].transcript);
          }
        }

        onTranscript?.({
          text: fullTranscript,
          isFinal: event.results[event.results.length - 1]?.isFinal || false,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        });

        if (event.results[event.results.length - 1].isFinal) {
          resolve(fullTranscript);
        }
      };

      try {
        onStart?.();
        this.recognition.start();
      } catch (error) {
        const errorMsg = `Failed to start speech recognition: ${error}`;
        console.error(errorMsg);
        onError?.(errorMsg);
        reject(errorMsg);
      }
    });
  }

  /**
   * Stop listening for voice input
   */
  stopListening(): string {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    return (this.currentTranscript + this.interimTranscript).trim();
  }

  /**
   * Abort listening
   */
  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
      this.currentTranscript = "";
      this.interimTranscript = "";
    }
  }

  /**
   * Get current transcript (interim + final)
   */
  getCurrentTranscript(): string {
    return (this.currentTranscript + this.interimTranscript).trim();
  }

  /**
   * Check if currently listening
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Update language
   */
  setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Check if browser supports Speech API
   */
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Convert audio file to text using Web Audio API + local processing
   * Note: This is a placeholder. For robust audio processing, use server-side solution
   */
  async convertAudioFileToText(audioBlob: Blob): Promise<string> {
    // This would require either:
    // 1. Google Cloud Speech-to-Text API (requires backend)
    // 2. AssemblyAI or similar service
    // 3. Local web audio processing (complex)

    // For now, we'll use Web Speech API with audio upload
    console.log(
      "Audio file processing would require backend service. Using Web Speech API is recommended for real-time input.",
    );
    throw new Error("Use startListening() for real-time voice input");
  }
}

// Export singleton instance
export const speechService = new SpeechService({
  language: "en-US",
  continuousMode: false,
  interimResults: true,
});

export default SpeechService;
