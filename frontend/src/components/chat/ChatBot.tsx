import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendChatMessage, speechToText, type ChatMessage } from "@/lib/api/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

export const ChatBot: React.FC = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(trimmed, messages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const text = await speechToText(blob);
          const trimmed = typeof text === "string" ? text.trim() : "";
          if (trimmed) setInput((prev) => (prev ? prev + " " + trimmed : trimmed));
        } catch {
          toast.error("Failed to transcribe audio. Please try again.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow microphone permission in your browser settings."
          : "Could not access microphone. Please check your device settings.";
      toast.error(msg);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          open && "hidden"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col border border-border bg-card shadow-2xl overflow-hidden",
            isMobile
              ? "inset-0 rounded-none"
              : "bottom-5 right-5 w-[380px] rounded-xl"
          )}
          style={isMobile ? undefined : { height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Parking Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3 text-muted-foreground">
                <Bot className="h-10 w-10" />
                <p className="text-sm">
                  Hi! Ask me anything about bookings, customers, or operations.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 max-w-[90%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 mr-auto">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3">
            {transcribing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Transcribing audio…
              </div>
            )}
            {recording ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center justify-center gap-[3px] h-10 rounded-md bg-destructive/10 border border-destructive/30 px-3">
                  <div className="h-2 w-2 rounded-full bg-destructive animate-pulse mr-2 shrink-0" />
                  {[...Array(14)].map((_, i) => (
                    <span
                      key={i}
                      className="inline-block w-[3px] rounded-full bg-destructive/70"
                      style={{
                        animation: `soundwave 0.6s ease-in-out ${i * 0.06}s infinite alternate`,
                      }}
                    />
                  ))}
                  <span className="ml-2 text-xs text-destructive font-medium whitespace-nowrap">Recording…</span>
                </div>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={stopRecording}
                  className="shrink-0 h-10 w-10"
                  title="Stop recording"
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="min-h-[40px] max-h-[100px] resize-none text-sm"
                  rows={1}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={startRecording}
                  disabled={loading || transcribing}
                  className="shrink-0 h-10 w-10"
                  title="Record voice"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="shrink-0 h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
