"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    text: string;
}

export function SathiChat() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Only show Sathi on student pages
    const isStudentPage = pathname?.includes('/student');

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            text: "Hi! I'm Sathi. I'm here to help you stay motivated and on track. How are you feeling today?",
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

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            text: input,
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token"); // Assuming auth stores token here

            // If no token, maybe show error or redirect? For now, let's try calling anyway or handle gracefully
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("http://localhost:3001/api/chat/message", {
                method: "POST",
                headers,
                body: JSON.stringify({ message: userMsg.text }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const data = await res.json();
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant", // Sathi
                text: data.reply,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "assistant", text: "I'm having trouble connecting right now. Please try again later." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (!isStudentPage) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={cn(
                    "pointer-events-auto mb-4 w-[350px] rounded-2xl border border-white/10 bg-[#11141d] shadow-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                    isOpen
                        ? "translate-y-0 opacity-100 h-[500px]"
                        : "translate-y-4 opacity-0 h-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                    <div className="flex items-center gap-2 text-white">
                        <div className="p-1 bg-white/20 rounded-full">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Sathi</h3>
                            <p className="text-[10px] text-white/80 leading-none">Your Academic Companion</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0c10]"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col gap-1 max-w-[85%]",
                                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                        >
                            <div className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}>
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === "user" ? "bg-indigo-600/20 text-indigo-400" : "bg-blue-600/20 text-blue-400"
                                    )}
                                >
                                    {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div
                                    className={cn(
                                        "p-3 rounded-2xl text-sm leading-relaxed",
                                        msg.role === "user"
                                            ? "bg-indigo-600 text-white rounded-br-none"
                                            : "bg-[#1f2430] text-gray-200 rounded-bl-none border border-white/5"
                                    )}
                                >
                                    {msg.text.replace('<Action:FocusBlock>', '')}
                                </div>
                            </div>

                            {/* Action Button */}
                            {msg.role === 'assistant' && msg.text.includes('<Action:FocusBlock>') && (
                                <button
                                    onClick={() => {
                                        // Trigger Action
                                        const token = localStorage.getItem("token");
                                        const headers: any = { "Content-Type": "application/json" };
                                        if (token) headers["Authorization"] = `Bearer ${token}`;

                                        fetch("http://localhost:3001/api/calendar/focus", { method: 'POST', headers })
                                            .then(res => res.json())
                                            .then(data => {
                                                setMessages(prev => [...prev, {
                                                    id: Date.now().toString(),
                                                    role: 'assistant',
                                                    text: "Done! I've added a Focus Block to your calendar starting in 10 minutes."
                                                }]);
                                            })
                                            .catch(err => console.error(err));
                                    }}
                                    className="ml-10 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <span>📅 Schedule Focus Block</span>
                                </button>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-2 mr-auto">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600/20 text-blue-400 shrink-0">
                                <Bot size={14} />
                            </div>
                            <div className="bg-[#1f2430] p-3 rounded-2xl rounded-bl-none border border-white/5">
                                <div className="flex gap-1 h-full items-center">
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 bg-[#11141d] border-t border-white/5 flex gap-2 overflow-x-auto">
                    <button
                        onClick={() => {
                            const token = localStorage.getItem("token");
                            const headers: any = { "Content-Type": "application/json" };
                            if (token) headers["Authorization"] = `Bearer ${token}`;

                            // Optimistic UI update
                            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Schedule a Focus Block" }]);
                            setLoading(true);

                            fetch("http://localhost:3001/api/calendar/focus", { method: 'POST', headers })
                                .then(res => res.json())
                                .then(data => {
                                    setMessages(prev => [...prev, {
                                        id: Date.now().toString(),
                                        role: 'assistant',
                                        text: "Done! I've added a Focus Block to your calendar starting in 10 minutes."
                                    }]);
                                })
                                .catch(err => console.error(err))
                                .finally(() => setLoading(false));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/20 transition-colors whitespace-nowrap"
                    >
                        📅 Focus Block
                    </button>
                    <button
                        onClick={() => setInput("Give me a motivation boost!")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs border border-purple-500/20 transition-colors whitespace-nowrap"
                    >
                        💪 Motivation
                    </button>
                </div>

                {/* Input */}
                <div className="p-3 bg-[#11141d] border-t border-white/10">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex items-center gap-2 bg-[#1f2430] rounded-full px-4 py-2 border border-white/5 focus-within:border-indigo-500/50 transition-colors"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group relative"
                >
                    <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
            )}
        </div>
    );
}
