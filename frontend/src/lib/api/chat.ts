/**
 * Chat API functions
 */
import { apiPost } from './client';
import { apiConfig, getAuthHeaders } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  answer: string;
  sql_used: string;
  row_count: number;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  return apiPost<ChatResponse>('/api/chat', { message, history });
}

export async function speechToText(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.webm');

  const headers = getAuthHeaders();
  delete (headers as Record<string, string>)['Content-Type'];

  const response = await fetch(`${apiConfig.baseURL}/api/chat/speech-to-text`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Speech to text failed' }));
    throw new Error(err.detail || 'Speech to text failed');
  }

  const data = await response.json();
  return data.transcription?.text ?? "";
}
