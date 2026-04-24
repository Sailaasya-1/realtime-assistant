import { useCallback, useEffect, useRef } from "react";
import { useStore } from "./store";
import { loadSettings } from "./SettingsStore";

// Custom hook to manage fetching suggestions based on the transcript and settings
export function useSuggestions() {

  // Access transcript lines and suggestion-related state from the store
  const transcriptLines = useStore((s) => s.transcriptLines);
  const addSuggestionBatch = useStore((s) => s.addSuggestionBatch);
  const isFetching = useStore((s) => s.isFetchingSuggestions);
  const setIsFetching = useStore((s) => s.setIsFetchingSuggestions);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchSuggestionsRef = useRef<(() => Promise<void>) | null>(null);
  const hasStarted = useRef(false);
  
  // Function to fetch suggestions from the backend API based on the current transcript and settings
  const fetchSuggestions = useCallback(async () => {
    console.log("=== fetchSuggestions called ===");
    console.log("isFetching:", isFetching);
    console.log("transcriptLines:", transcriptLines.length);
    
    // Prevent multiple simultaneous fetches
    if (isFetching) { console.log("BLOCKED: isFetching"); return; }
    
    // Load settings and check for required API key and transcript content before making the API call
    const settings = loadSettings();
    if (transcriptLines.length === 0) { console.log("BLOCKED: no transcript"); return; }
    
    // Prepare the transcript context for the API call by taking the last few lines based on settings
    const transcriptText = transcriptLines
      .slice(-settings.suggestionContextLines)
      .map((line) => `${line.timestamp} ${line.text}`)
      .join("\n");
    
    setIsFetching(true);

    // Make the API call to fetch suggestions based on the prepared transcript context and settings
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          prompt: settings.suggestionPrompt
        }),
      });
      
      // Parse the response and add the received suggestions to the store
      const data = await res.json();
      console.log("Suggestions response:", data);
      if (data.suggestions?.length > 0) {
        addSuggestionBatch(data.suggestions);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setIsFetching(false);
    }
  }, [transcriptLines, isFetching, addSuggestionBatch, setIsFetching]);
  
  // Keep a ref to the fetchSuggestions function to use inside setInterval
  useEffect(() => {
    fetchSuggestionsRef.current = fetchSuggestions;
  }, [fetchSuggestions]);

  // Trigger once transcript has meaningful content, then every 30s
  useEffect(() => {
    const totalWords = transcriptLines
      .map((l) => l.text)
      .join(" ")
      .split(" ")
      .filter(Boolean).length;
      
    // Start fetching suggestions when there are more than 10 words in the transcript and it hasn't started yet
    if (totalWords > 10 && !hasStarted.current) {
      hasStarted.current = true;

      fetchSuggestionsRef.current?.();

      intervalRef.current = setInterval(() => {
        fetchSuggestionsRef.current?.();
      }, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [transcriptLines]);

  // Reset when transcript is cleared
  useEffect(() => {
    if (transcriptLines.length === 0) {
      hasStarted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [transcriptLines.length]);

  return { fetchSuggestions, isFetching };
}