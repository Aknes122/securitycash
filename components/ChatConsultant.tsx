import React, { useState, useEffect, useRef } from "react";
import { AppState } from "../types";
import { sendChatMessage, ChatMessage } from "../utils/aiConsultant";
import {
  Send,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  PiggyBank,
  BarChart3,
  UserCircle2,
  Sparkles,
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

    const newUserMessage: ChatMessage = {
      role: "user",
      parts: [{ text: userMessageText }],
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const aiResponse = await sendChatMessage(userMessageText, messages, state);
      const newAiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: aiResponse }],
      };
      setMessages([...updatedMessages, newAiMessage]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Desculpe, ocorreu um erro ao obter a análise."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Deseja encerrar essa sessão e limpar o histórico?")) {
      setMessages([]);
      setErrorMsg(null);
    }
  };

  const formatMessageText = (text: string): React.ReactNode => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="text-sm font-bold mt-4 mb-1.5 text-zinc-800 dark:text-zinc-100">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="text-sm font-extrabold mt-5 mb-2 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }

      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) parts.push(line.substring(lastIndex, match.index));
        parts.push(
          <strong key={match.index} className="font-bold text-zinc-900 dark:text-white">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) parts.push(line.substring(lastIndex));
      const content = parts.length > 0 ? parts : line;

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const listText = line.trim().substring(2);
        return (
          <li key={i} className="ml-4 text-sm text-zinc-700 dark:text-zinc-300 my-0.5 leading-relaxed list-disc pl-1">
            {formatMessageText(listText)}
          </li>
        );
      }

      if (line.trim() === "") return <div key={i} className="h-2" />;

      return (
        <p key={i} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 my-1">
          {content}
        </p>
      );
    });
  };

  const suggestions = [
    {
      title: "Alcançar minhas metas",
      sub: "Estratégia personalizada com base nas suas metas ativas",
      text: "Como posso me planejar melhor para alcançar minhas metas atuais cadastradas no app?",
      icon: TrendingUp,
    },
    {
      title: "Cortar gastos",
      sub: "Análise dos seus lançamentos mais recentes",
      text: "Analise meus gastos e transações recentes e sugira onde posso fazer cortes sem sofrer.",
      icon: PiggyBank,
    },
    {
      title: "Investir com segurança",
      sub: "Opções adequadas ao seu perfil e saldo atual",
      text: "Com base no meu saldo e renda, qual a melhor forma de criar uma reserva e onde investir com segurança?",
      icon: BarChart3,
    },
  ];

  const userName = state.userName || "você";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/70 rounded-3xl overflow-hidden shadow-sm">

      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-white dark:text-zinc-900" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              Meu Assessor Financeiro
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight">
              Análise personalizada · Dados do seu app
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-all"
            title="Encerrar sessão"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Encerrar</span>
          </button>
        )}
      </header>

      {/* Messages / Welcome */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto h-full flex flex-col justify-center gap-6 py-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Bem-vindo
              </p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white leading-snug">
                Olá, {userName}.<br />
                <span className="text-zinc-400 dark:text-zinc-500 font-medium text-xl">
                  Em que posso ajudar hoje?
                </span>
              </h3>
            </div>

            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.text)}
                  className="group w-full flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 transition-all duration-200 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow transition-shadow">
                    <s.icon size={16} className="text-zinc-600 dark:text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                      {s.sub}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 transition-colors" />
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-300 dark:text-zinc-600 text-center leading-relaxed">
              As análises são baseadas nos seus dados cadastrados no app e têm caráter educativo.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const textContent = msg.parts[0]?.text || "";

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                      isUser
                        ? "bg-zinc-200 dark:bg-zinc-700"
                        : "bg-zinc-900 dark:bg-white"
                    }`}
                  >
                    {isUser ? (
                      <UserCircle2 size={16} className="text-zinc-500 dark:text-zinc-300" />
                    ) : (
                      <Sparkles size={13} className="text-white dark:text-zinc-900" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm ${
                      isUser
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-tr-sm"
                        : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{textContent}</p>
                    ) : (
                      <div className="space-y-0.5">{formatMessageText(textContent)}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading */}
            {isLoading && (
              <div className="flex gap-3 animate-in fade-in duration-300">
                <div className="w-7 h-7 rounded-full shrink-0 bg-zinc-900 dark:bg-white flex items-center justify-center mt-0.5">
                  <Sparkles size={13} className="text-white dark:text-zinc-900" />
                </div>
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">Analisando...</span>
                </div>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="flex gap-3 p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Erro na análise</p>
                  <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 pb-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="max-w-2xl mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escreva sua dúvida financeira..."
            className="flex-1 h-11 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              inputValue.trim() && !isLoading
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 active:scale-95 cursor-pointer"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
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
