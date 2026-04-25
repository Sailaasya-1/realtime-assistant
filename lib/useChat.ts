"use client";

import { useState, useCallback } from "react";
import { loadSettings } from "./SettingsStore";
import type { Suggestion } from "./types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  label?: string | null;
  timestamp: number;
}

export function useChat(getTranscript: () => string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (userText: string, label?: string) => {
    const settings = loadSettings();

    // Step 1: Add user bubble immediately
    const userMsg: ChatMessage = {
      role: "user",
      content: userText,
      label,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Step 2: Add empty assistant bubble — fills token by token
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: "",
      label: null,
      timestamp: Date.now(),
    }]);

    try {
      const transcript = getTranscript();
      const contextLines = transcript
        .split("\n")
        .slice(-settings.detailContextLines)
        .join("\n");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: settings.chatPrompt.replace("{{transcript}}", contextLines),
          transcript: contextLines,
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Step 3: Read stream chunk by chunk
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices[0]?.delta?.content ?? "";

            if (token) {
              // Step 4: Append each token to assistant bubble
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + token,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, getTranscript]);

  // Called when user clicks a suggestion card
  const sendSuggestion = useCallback((suggestion: Suggestion) => {
    const label = suggestion.type.replace(/_/g, " ").toUpperCase();
    sendMessage(suggestion.preview, label);
  }, [sendMessage]);

  return { messages, isLoading, sendMessage, sendSuggestion };
}