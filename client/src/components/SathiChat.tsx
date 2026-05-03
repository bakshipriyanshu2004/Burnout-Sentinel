"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, Mic, MicOff, Paperclip, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
    imageUrl?: string; // for user-uploaded images
}

interface SathiChatProps {
    isOpen: boolean;
    onClose: () => void;
}

// Extend Window for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function SathiChat({ isOpen, onClose }: SathiChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "Hi! I'm Sathi, your academic companion. Ask me anything from your course materials, upload an image of a problem, or just talk — I'm here to help! 📚",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // ── Speech-to-Text Setup ────────────────────────────────────────────────
    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join("");
            setInput(transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // ── Image Upload ────────────────────────────────────────────────────────
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Image must be under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setImagePreview(dataUrl);
            // Strip the "data:image/...;base64," prefix for the API
            setImageBase64(dataUrl.split(",")[1]);
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImagePreview(null);
        setImageBase64(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── Send Message ────────────────────────────────────────────────────────
    const handleSend = async () => {
        if ((!input.trim() && !imageBase64) || loading) return;

        const userText = input.trim() || (imageBase64 ? "Please analyze this image." : "");
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: userText,
            imageUrl: imagePreview || undefined,
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        const sentImage = imageBase64;
        clearImage();
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("http://localhost:3001/api/chat/message", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    message: userText,
                    imageBase64: sentImage || undefined,
                }),
            });

            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                text: data.reply,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                text: "I'm having trouble connecting right now. Please try again later.",
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
            )}

            {/* Chat Panel */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-[440px] max-w-[100vw] z-50 flex flex-col bg-[#0e1117] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 p-5 shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Sathi Assistant</h3>
                            <p className="text-[11px] text-white/75 leading-none mt-0.5">RAG · Vision · Voice</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* RAG Badge */}
                <div className="px-4 py-2 bg-indigo-950/60 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    Course-grounded answers · Image analysis · Voice input enabled
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0c12]">
                    {messages.map(msg => (
                        <div key={msg.id} className={cn(
                            "flex flex-col gap-1 max-w-[92%]",
                            msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                            <div className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                    msg.role === "user" ? "bg-indigo-600/30 text-indigo-400" : "bg-blue-600/30 text-blue-400"
                                )}>
                                    {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {/* User image attachment */}
                                    {msg.imageUrl && (
                                        <img
                                            src={msg.imageUrl}
                                            alt="uploaded"
                                            className="rounded-xl max-w-[200px] max-h-[160px] object-cover border border-white/10"
                                        />
                                    )}
                                    {msg.text && (
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                                            msg.role === "user"
                                                ? "bg-indigo-600 text-white rounded-br-none"
                                                : "bg-[#1a1f2e] text-gray-200 rounded-bl-none border border-white/5"
                                        )}>
                                            {msg.text.replace('<Action:FocusBlock>', '')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {msg.role === 'assistant' && msg.text.includes('<Action:FocusBlock>') && (
                                <button
                                    onClick={() => {
                                        const token = localStorage.getItem("token");
                                        const headers: any = { "Content-Type": "application/json" };
                                        if (token) headers["Authorization"] = `Bearer ${token}`;
                                        fetch("http://localhost:3001/api/calendar/focus", { method: 'POST', headers })
                                            .then(() => setMessages(prev => [...prev, {
                                                id: Date.now().toString(),
                                                role: 'assistant',
                                                text: "Done! I've added a Focus Block to your calendar starting in 10 minutes."
                                            }]));
                                    }}
                                    className="ml-10 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Schedule Focus Block
                                </button>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-2.5 mr-auto">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-600/30 text-blue-400 shrink-0">
                                <Bot size={13} />
                            </div>
                            <div className="bg-[#1a1f2e] p-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2 bg-[#0e1117] border-t border-white/5 flex gap-2 overflow-x-auto shrink-0">
                    {["Explain AIML", "What is robotics?", "Help me study", "Motivation boost"].map(q => (
                        <button
                            key={q}
                            onClick={() => setInput(q)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/20 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* Image Preview */}
                {imagePreview && (
                    <div className="px-4 py-2 bg-[#0e1117] border-t border-white/5 flex items-center gap-3 shrink-0">
                        <img src={imagePreview} alt="preview" className="h-14 w-14 rounded-lg object-cover border border-white/10" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-300 font-medium">Image ready to send</p>
                            <p className="text-xs text-gray-500">Add a question or send as-is</p>
                        </div>
                        <button onClick={clearImage} className="text-red-400 hover:text-red-300 p-1">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Input Bar */}
                <div className="p-4 bg-[#0e1117] border-t border-white/10 shrink-0">
                    {/* Voice listening indicator */}
                    {isListening && (
                        <div className="flex items-center gap-2 mb-2 px-2">
                            <div className="flex gap-0.5">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce"
                                        style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                            <span className="text-red-400 text-xs font-medium">Listening... speak now</span>
                        </div>
                    )}

                    <form
                        onSubmit={e => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2 bg-[#1a1f2e] rounded-xl px-3 py-2.5 border border-white/5 focus-within:border-indigo-500/50 transition-colors"
                    >
                        {/* Image upload button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "text-gray-500 hover:text-indigo-400 transition-colors shrink-0",
                                imageBase64 && "text-indigo-400"
                            )}
                            title="Upload image"
                        >
                            <ImageIcon size={16} />
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask about your syllabus or upload an image..."}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500 min-w-0"
                        />

                        {/* Mic button */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={cn(
                                "shrink-0 p-1 rounded-lg transition-all",
                                isListening
                                    ? "text-red-400 bg-red-500/10 animate-pulse"
                                    : "text-gray-500 hover:text-indigo-400"
                            )}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={(!input.trim() && !imageBase64) || loading}
                            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
