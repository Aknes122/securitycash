import React, { useState, useEffect, useRef } from "react";
import { AppState } from "../types";
import { sendChatMessage, ChatMessage } from "../utils/aiConsultant";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck
} from "lucide-react";

interface ChatConsultantProps {
  state: AppState;
}

const ChatConsultant: React.FC<ChatConsultantProps> = ({ state }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageText = textToSend.trim();
    setInputValue("");
    setErrorMsg(null);

    // 1. Add user message locally
    const newUserMessage: ChatMessage = {
      role: "user",
      parts: [{ text: userMessageText }]
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Call helper
      const aiResponse = await sendChatMessage(userMessageText, messages, state);

      // 3. Add AI message locally
      const newAiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: aiResponse }]
      };
      setMessages([...updatedMessages, newAiMessage]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Desculpe, ocorreu um erro ao obter conselhos da IA."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Deseja realmente limpar toda a conversa com o consultor?")) {
      setMessages([]);
      setErrorMsg(null);
    }
  };

  // Helper to parse basic markdown elements (bold, lists, headers, empty lines)
  const formatMessageText = (text: string): React.ReactNode => {
    return text.split("\n").map((line, i) => {
      let formattedLine = line;

      // Handle sub-headers (###)
      if (formattedLine.startsWith("### ")) {
        return (
          <h4 key={i} className="text-sm font-bold mt-4 mb-2 text-zinc-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            {formattedLine.replace("### ", "")}
          </h4>
        );
      }
      // Handle headers (##)
      if (formattedLine.startsWith("## ")) {
        return (
          <h3 key={i} className="text-base font-black mt-5 mb-3 text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-1">
            {formattedLine.replace("## ", "")}
          </h3>
        );
      }

      // Handle bold syntax: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(formattedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(formattedLine.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-extrabold text-blue-600 dark:text-blue-400">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < formattedLine.length) {
        parts.push(formattedLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : formattedLine;

      // Handle lists starting with "-" or "*"
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const listText = line.trim().substring(2);
        return (
          <li key={i} className="ml-4 list-disc text-sm text-zinc-700 dark:text-zinc-300 my-1 leading-relaxed pl-1">
            {formatMessageText(listText)}
          </li>
        );
      }

      // Handle empty lines for spacing
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }

      return (
        <p key={i} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 my-1.5">
          {content}
        </p>
      );
    });
  };

  const suggestions = [
    {
      title: "Como Bater Minhas Metas?",
      sub: "Estratégia personalizada para metas ativas",
      text: "Como posso me planejar melhor para alcançar minhas metas atuais cadastradas no app?",
      icon: Coins,
      color: "emerald"
    },
    {
      title: "Onde Economizar Hoje?",
      sub: "Análise dos meus últimos lançamentos",
      text: "Analise meus gastos e transações recentes e sugira onde posso fazer cortes sem sofrer.",
      icon: TrendingUp,
      color: "blue"
    },
    {
      title: "Reserva & Investimentos",
      sub: "Como começar com meu saldo atual",
      text: "Com base no meu saldo e renda do app, qual a melhor forma de criar uma reserva e onde investir com segurança?",
      icon: ShieldCheck,
      color: "amber"
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2.5rem] shadow-xl overflow-hidden animate-in fade-in duration-500 relative">
      
      {/* Glow effect background */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between bg-white/50 dark:bg-zinc-950/40 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
              Consultor IA FinWise
              <span className="text-[9px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                Gemini 2.0
              </span>
            </h2>
            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Seu assistente pessoal para finanças, economia e investimentos
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Limpar conversa"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Limpar Chat</span>
          </button>
        )}
      </header>

      {/* Main Content (Messages feed / Welcome Suggestions) */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar space-y-6 relative z-10">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto h-full flex flex-col justify-center py-8">
            <div className="text-center mb-8 space-y-3">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                Olá! Eu sou seu Consultor Financeiro de IA
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                Estou sincronizado com seus lançamentos, saldos e metas. Me pergunte qualquer coisa sobre investimentos ou como organizar suas finanças!
              </p>
            </div>

            {/* Sugestões rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.text)}
                  className="group flex flex-col items-start p-5 bg-white/70 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500/30 transition-all duration-300 text-left"
                >
                  <div className={`p-2.5 bg-${s.color}-500/10 text-${s.color}-500 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                    <s.icon size={18} />
                  </div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1">
                    {s.title}
                    <ChevronRight size={12} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-normal font-medium">
                    {s.sub}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const textContent = msg.parts[0]?.text || "";
              
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
                      isUser
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        : "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                    }`}
                  >
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Bubble content */}
                  <div
                    className={`p-4 rounded-2xl text-zinc-800 dark:text-zinc-200 shadow-sm border ${
                      isUser
                        ? "bg-blue-600 text-white border-transparent rounded-tr-none"
                        : "bg-white/80 dark:bg-zinc-950/60 border-zinc-200/50 dark:border-zinc-800/50 rounded-tl-none"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                        {textContent}
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {formatMessageText(textContent)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loader indicator while generating */}
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-md">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-950/60 border border-zinc-200/50 dark:border-zinc-800/50 rounded-tl-none flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">
                    Pensando...
                  </span>
                </div>
              </div>
            )}

            {/* Error Message banner */}
            {errorMsg && (
              <div className="max-w-md mx-auto p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-start gap-3 shadow-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-left space-y-1">
                  <p className="text-sm font-black">Falha na Conexão</p>
                  <p className="text-xs leading-normal">{errorMsg}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/40 relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="max-w-3xl mx-auto flex items-center gap-2 relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pergunte sobre CDB, Tesouro, como economizar nas metas..."
            className="flex-1 bg-transparent py-2.5 px-4 outline-none border-none text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`p-2.5 rounded-xl flex items-center justify-center text-white shadow-lg transition-all ${
              inputValue.trim() && !isLoading
                ? "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 hover:scale-105 active:scale-95 cursor-pointer"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 shadow-none cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatConsultant;
