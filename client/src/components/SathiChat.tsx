"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
}

interface SathiChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SathiChat({ isOpen, onClose }: SathiChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "Hi! I'm Sathi, your academic companion. I can answer questions from your course materials, help you understand concepts, and keep you motivated. What would you like to know?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("http://localhost:3001/api/chat/message", {
                method: "POST",
                headers,
                body: JSON.stringify({ message: userMsg.text }),
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
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}

            {/* Chat Panel — slides in from right */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-[420px] max-w-[100vw] z-50 flex flex-col bg-[#0e1117] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-700 p-5">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Sathi Assistant</h3>
                            <p className="text-[11px] text-white/75 leading-none mt-0.5">Answers from your course materials via RAG</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* RAG Notice */}
                <div className="px-4 py-2.5 bg-indigo-950/60 border-b border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                    Grounded in your course documents — not general AI knowledge
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0a0c12]">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={cn("flex flex-col gap-1 max-w-[90%]", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}
                        >
                            <div className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                    msg.role === "user" ? "bg-indigo-600/30 text-indigo-400" : "bg-blue-600/30 text-blue-400"
                                )}>
                                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div className={cn(
                                    "p-3.5 rounded-2xl text-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-br-none"
                                        : "bg-[#1a1f2e] text-gray-200 rounded-bl-none border border-white/5"
                                )}>
                                    {msg.text.replace('<Action:FocusBlock>', '')}
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
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/30 text-blue-400 shrink-0">
                                <Bot size={14} />
                            </div>
                            <div className="bg-[#1a1f2e] p-3.5 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2.5 bg-[#0e1117] border-t border-white/5 flex gap-2 overflow-x-auto">
                    {["What is AI?", "Explain robotics", "Help me study", "Motivation boost"].map(q => (
                        <button
                            key={q}
                            onClick={() => setInput(q)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/20 transition-colors"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 bg-[#0e1117] border-t border-white/10">
                    <form
                        onSubmit={e => { e.preventDefault(); handleSend(); }}
                        className="flex items-center gap-2 bg-[#1a1f2e] rounded-xl px-4 py-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask Sathi anything from your syllabus..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
