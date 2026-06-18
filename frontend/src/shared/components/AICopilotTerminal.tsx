"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    X,
    Minus,
    Sparkles,
    Send,
    Copy,
    Check,
    Terminal,
    Bot,
    User,
    ChevronDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    codeBlock?: {
        language: string;
        code: string;
    };
    timestamp: Date;
    isStreaming?: boolean;
}

// ─── Simulated AI Responses ──────────────────────────────────────────
const AI_RESPONSES: Record<string, { text: string; code: { language: string; code: string } }> = {
    default: {
        text: "Here's how you can implement that using the Sentinel KYC SDK:",
        code: {
            language: "javascript",
            code: `const Sentinel = require('@sentinel-kyc/node');

const client = new Sentinel.Client({
  apiKey: process.env.SENTINEL_API_KEY,
  environment: 'production'
});

// Verify identity document
const result = await client.kyc.verify({
  document: {
    type: 'passport',
    number: 'AB1234567',
    country: 'US'
  },
  checks: ['identity', 'watchlist', 'pep']
});

console.log('Verification Status:', result.status);
console.log('Risk Score:', result.riskScore);`,
        },
    },
    passport: {
        text: "Here's a Node.js script to check a passport against the AML watchlist using Sentinel's SDK:",
        code: {
            language: "javascript",
            code: `const Sentinel = require('@sentinel-kyc/node');

const client = new Sentinel.Client({
  apiKey: process.env.SENTINEL_API_KEY,
  environment: 'production'
});

async function checkPassportAML(passportData) {
  try {
    // Step 1: Extract identity from passport
    const identity = await client.documents.extract({
      type: 'passport',
      data: passportData,
      ocr: true,
    });

    console.log('✓ Identity extracted:', identity.fullName);

    // Step 2: Screen against AML watchlists
    const screening = await client.aml.screen({
      fullName: identity.fullName,
      dateOfBirth: identity.dateOfBirth,
      nationality: identity.nationality,
      watchlists: [
        'OFAC_SDN',
        'UN_SANCTIONS',
        'EU_SANCTIONS',
        'PEP_DATABASE',
        'INTERPOL_NOTICES'
      ],
      fuzzyMatch: true,
      threshold: 0.85,
    });

    // Step 3: Evaluate results
    if (screening.hits.length === 0) {
      console.log('✅ CLEAR — No AML hits found');
      return { status: 'clear', risk: 'low' };
    }

    console.warn(\`⚠️  FLAGGED — \${screening.hits.length} potential matches\`);
    
    for (const hit of screening.hits) {
      console.log(\`  → \${hit.listName}: \${hit.matchScore}% match\`);
      console.log(\`    Entity: \${hit.entityName}\`);
      console.log(\`    Reason: \${hit.listingReason}\`);
    }

    return { 
      status: 'flagged', 
      risk: 'high',
      hits: screening.hits 
    };

  } catch (error) {
    console.error('Screening failed:', error.message);
    throw error;
  }
}

// Execute the check
checkPassportAML(rawPassportBuffer);`,
        },
    },
    kyc: {
        text: "Here's a complete KYC verification flow with our SDK:",
        code: {
            language: "javascript",
            code: `const Sentinel = require('@sentinel-kyc/node');

const client = new Sentinel.Client({
  apiKey: process.env.SENTINEL_API_KEY,
});

async function fullKYCFlow(userData) {
  // Step 1: Create a verification session
  const session = await client.sessions.create({
    referenceId: userData.userId,
    type: 'full_kyc',
    redirectUrl: 'https://app.yourcompany.com/verified',
  });

  // Step 2: Submit identity documents
  const docCheck = await client.kyc.submitDocument({
    sessionId: session.id,
    document: {
      type: 'drivers_license',
      frontImage: userData.docFront,   // base64
      backImage: userData.docBack,     // base64
    },
  });

  // Step 3: Liveness check
  const liveness = await client.kyc.livenessCheck({
    sessionId: session.id,
    selfieImage: userData.selfie,
  });

  // Step 4: Get final decision
  const decision = await client.kyc.getDecision({
    sessionId: session.id,
  });

  console.log('KYC Result:', decision.status);
  console.log('Confidence:', decision.confidence);
  
  return decision;
}`,
        },
    },
};

function getAIResponse(input: string) {
    const lower = input.toLowerCase();
    if (lower.includes("passport") || lower.includes("aml") || lower.includes("watchlist")) {
        return AI_RESPONSES.passport;
    }
    if (lower.includes("kyc") || lower.includes("verify") || lower.includes("identity")) {
        return AI_RESPONSES.kyc;
    }
    return AI_RESPONSES.default;
}

// ─── Code Syntax Highlighter (simple) ────────────────────────────────
function highlightCode(code: string): string {
    let html = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Comments
    html = html.replace(/(\/\/.*$)/gm, '<span class="code-comment">$1</span>');

    // Strings (single and double quotes, template literals)
    html = html.replace(
        /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,
        '<span class="code-string">$1</span>'
    );

    // Keywords
    html = html.replace(
        /\b(const|let|var|function|async|await|return|if|else|for|try|catch|throw|new|require|import|from|export|console)\b/g,
        '<span class="code-keyword">$1</span>'
    );

    // Booleans & special values
    html = html.replace(
        /\b(true|false|null|undefined|process)\b/g,
        '<span class="code-variable">$1</span>'
    );

    // Numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>');

    return html;
}

// ─── CopyButton ──────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
                 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80
                 transition-all duration-200 cursor-pointer"
        >
            {copied ? (
                <>
                    <Check className="w-3 h-3 text-sentinel-green" />
                    <span className="text-sentinel-green">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}

// ─── StreamingText ───────────────────────────────────────────────────
function StreamingText({
    text,
    onComplete,
}: {
    text: string;
    onComplete: () => void;
}) {
    const [displayed, setDisplayed] = useState("");
    const indexRef = useRef(0);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayed("");

        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayed(text.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                clearInterval(interval);
                onComplete();
            }
        }, 18);

        return () => clearInterval(interval);
    }, [text, onComplete]);

    return (
        <span>
            {displayed}
            {displayed.length < text.length && (
                <motion.span
                    className="inline-block w-1.5 h-4 bg-sentinel-blue ml-0.5 align-text-bottom"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                />
            )}
        </span>
    );
}

// ─── StreamingCode ───────────────────────────────────────────────────
function StreamingCode({
    code,
    language,
    onComplete,
}: {
    code: string;
    language: string;
    onComplete: () => void;
}) {
    const [displayed, setDisplayed] = useState("");
    const indexRef = useRef(0);
    const codeRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        indexRef.current = 0;
        setDisplayed("");

        const interval = setInterval(() => {
            if (indexRef.current < code.length) {
                // Stream 2-4 characters at a time for speed
                const chunkSize = Math.min(3, code.length - indexRef.current);
                indexRef.current += chunkSize;
                setDisplayed(code.slice(0, indexRef.current));
            } else {
                clearInterval(interval);
                onComplete();
            }
        }, 12);

        return () => clearInterval(interval);
    }, [code, onComplete]);

    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [displayed]);

    const isComplete = displayed.length >= code.length;

    return (
        <div className="mt-3 rounded-lg overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
            {/* Code header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-red/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-amber/60" />
                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-green/60" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 ml-2">
                        {language}
                    </span>
                </div>
                {isComplete && <CopyButton text={code} />}
            </div>
            {/* Code area */}
            <pre
                ref={codeRef}
                className="p-4 overflow-x-auto overflow-y-auto max-h-[320px] text-[13px] leading-relaxed font-mono"
            >
                <code
                    dangerouslySetInnerHTML={{
                        __html: highlightCode(displayed),
                    }}
                />
                {!isComplete && (
                    <motion.span
                        className="inline-block w-2 h-4 bg-sentinel-blue ml-0.5 align-text-bottom"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    />
                )}
            </pre>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────
export function AICopilotTerminal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                'Welcome to Sentinel AI Copilot. I can help you write integration code for our KYC & AML APIs. Try asking: "Write a Node.js script to check this passport against the AML watchlist."',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [streamPhase, setStreamPhase] = useState<
        "idle" | "text" | "code"
    >("idle");
    const [currentResponse, setCurrentResponse] = useState<{
        text: string;
        code: { language: string; code: string };
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || isProcessing) return;

            const userMessage: Message = {
                id: `user-${Date.now()}`,
                role: "user",
                content: input.trim(),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setIsProcessing(true);

            // Simulate thinking delay
            const response = getAIResponse(input);
            setCurrentResponse(response);

            setTimeout(() => {
                const assistantId = `assistant-${Date.now()}`;
                setMessages((prev) => [
                    ...prev,
                    {
                        id: assistantId,
                        role: "assistant",
                        content: response.text,
                        codeBlock: response.code,
                        timestamp: new Date(),
                        isStreaming: true,
                    },
                ]);
                setStreamPhase("text");
            }, 800);
        },
        [input, isProcessing]
    );

    const handleTextStreamComplete = useCallback(() => {
        setStreamPhase("code");
    }, []);

    const handleCodeStreamComplete = useCallback(() => {
        setStreamPhase("idle");
        setIsProcessing(false);
        setCurrentResponse(null);
        setMessages((prev) =>
            prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
        );
    }, []);

    // Keyboard shortcut: Ctrl+K to toggle
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, isMinimized]);

    return (
        <>
            {/* ─── Floating trigger button ─────────────────────────────── */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                       bg-gradient-to-br from-sentinel-blue to-[#0088cc]
                       flex items-center justify-center shadow-lg shadow-sentinel-blue/20
                       hover:shadow-sentinel-blue/40 transition-shadow duration-300 cursor-pointer"
                        id="ai-copilot-trigger"
                    >
                        <Sparkles className="w-6 h-6 text-black" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── Terminal window ─────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={
                            isMinimized
                                ? { opacity: 1, y: 0, scale: 1, height: 56 }
                                : { opacity: 1, y: 0, scale: 1, height: "auto" }
                        }
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="fixed bottom-6 right-6 z-50 w-[460px] max-h-[600px]
                       rounded-2xl overflow-hidden
                       glass-strong glow-blue
                       flex flex-col"
                        id="ai-copilot-terminal"
                    >
                        {/* ─── Title bar ──────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]
                            bg-gradient-to-r from-sentinel-blue/5 to-transparent">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-sentinel-blue/10 flex items-center justify-center">
                                    <Terminal className="w-4 h-4 text-sentinel-blue" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-white/90">
                                        Sentinel AI Copilot
                                    </h3>
                                    <p className="text-[10px] text-white/30 tracking-wide">
                                        ⌘K to toggle • Powered by Sentinel AI
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="w-7 h-7 rounded-md flex items-center justify-center
                             text-white/30 hover:text-white/60 hover:bg-white/5
                             transition-colors cursor-pointer"
                                >
                                    {isMinimized ? (
                                        <ChevronDown className="w-4 h-4 rotate-180" />
                                    ) : (
                                        <Minus className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        setIsMinimized(false);
                                    }}
                                    className="w-7 h-7 rounded-md flex items-center justify-center
                             text-white/30 hover:text-sentinel-red hover:bg-sentinel-red/10
                             transition-colors cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ─── Messages area ──────────────────────────────────── */}
                        {!isMinimized && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-h-[440px]"
                            >
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 20,
                                        }}
                                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""
                                            }`}
                                    >
                                        {message.role === "assistant" && (
                                            <div className="w-6 h-6 rounded-md bg-sentinel-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot className="w-3.5 h-3.5 text-sentinel-blue" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[380px] ${message.role === "user"
                                                    ? "bg-sentinel-blue/10 border border-sentinel-blue/20 text-sentinel-blue rounded-2xl rounded-br-md px-4 py-2.5"
                                                    : ""
                                                }`}
                                        >
                                            {/* Text content */}
                                            <p className="text-sm leading-relaxed text-white/80">
                                                {message.isStreaming && streamPhase === "text" ? (
                                                    <StreamingText
                                                        text={message.content}
                                                        onComplete={handleTextStreamComplete}
                                                    />
                                                ) : (
                                                    message.content
                                                )}
                                            </p>

                                            {/* Code block */}
                                            {message.codeBlock && (
                                                <>
                                                    {message.isStreaming && streamPhase === "code" ? (
                                                        <StreamingCode
                                                            code={message.codeBlock.code}
                                                            language={message.codeBlock.language}
                                                            onComplete={handleCodeStreamComplete}
                                                        />
                                                    ) : !message.isStreaming ? (
                                                        <div className="mt-3 rounded-lg overflow-hidden border border-white/[0.06] bg-[#0d0d0d]">
                                                            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.06]">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex gap-1.5">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-red/60" />
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-amber/60" />
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-sentinel-green/60" />
                                                                    </div>
                                                                    <span className="text-[10px] uppercase tracking-widest text-white/30 ml-2">
                                                                        {message.codeBlock.language}
                                                                    </span>
                                                                </div>
                                                                <CopyButton text={message.codeBlock.code} />
                                                            </div>
                                                            <pre className="p-4 overflow-x-auto overflow-y-auto max-h-[320px] text-[13px] leading-relaxed font-mono">
                                                                <code
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: highlightCode(
                                                                            message.codeBlock.code
                                                                        ),
                                                                    }}
                                                                />
                                                            </pre>
                                                        </div>
                                                    ) : null}
                                                </>
                                            )}
                                        </div>

                                        {message.role === "user" && (
                                            <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                                                <User className="w-3.5 h-3.5 text-white/40" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {/* Processing indicator */}
                                {isProcessing && streamPhase === "idle" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 rounded-md bg-sentinel-blue/10 flex items-center justify-center">
                                            <Bot className="w-3.5 h-3.5 text-sentinel-blue" />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-sentinel-blue"
                                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                                    transition={{
                                                        duration: 1.2,
                                                        repeat: Infinity,
                                                        delay: i * 0.2,
                                                    }}
                                                />
                                            ))}
                                            <span className="text-xs text-white/30 ml-2">
                                                Generating code...
                                            </span>
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </motion.div>
                        )}

                        {/* ─── Input area ─────────────────────────────────────── */}
                        {!isMinimized && (
                            <form
                                onSubmit={handleSubmit}
                                className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]"
                            >
                                <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-4 py-2.5
                                border border-white/[0.06] focus-within:border-sentinel-blue/30
                                transition-colors">
                                    <MessageSquare className="w-4 h-4 text-white/20 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask Sentinel AI to write integration code..."
                                        className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20
                               outline-none"
                                        disabled={isProcessing}
                                        id="ai-copilot-input"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isProcessing}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center
                               bg-sentinel-blue/10 hover:bg-sentinel-blue/20
                               disabled:opacity-30 disabled:cursor-not-allowed
                               transition-colors cursor-pointer"
                                    >
                                        <Send className="w-4 h-4 text-sentinel-blue" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/20 mt-2 text-center">
                                    Sentinel AI generates example integration code using our SDK.
                                    Always review before production use.
                                </p>
                            </form>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
