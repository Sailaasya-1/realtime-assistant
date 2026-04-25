
// Define Suggestion types
export interface Suggestion {
  type: "question_to_ask" | "talking_point" | "fact_check" | "answer";
  preview: string;
  detail: string;
}


// Define the structure of a batch of suggestions, a chat message, and the exported session format
export interface SuggestionBatch {
  id: string;
  timestamp: number;
  suggestions: Suggestion[];
}

// Define the structure of a chat message, including a unique id, role, content, and timestamp
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  label: string | null;
  timestamp: number;
}


// Define the structure of the exported session
export interface ExportSession {
  exportedAt: string;
  transcript: Array<{ timestamp: string; text: string }>;
  suggestionBatches: Array<{
    timestamp: string;
    suggestions: Suggestion[];
  }>;

  // The chat history is an array of messages with their role, content, and timestamp
  chatHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}