import React, { useState, useEffect, useRef } from "react";
import { AppState, Transaction, Goal, Reminder, Category, AIAction, ExecutedActionResult } from "../types";
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
  CheckCircle2,
  Wand2,
  Key,
  Check,
} from "lucide-react";

interface ChatConsultantProps {
  state: AppState;
  userId?: string;
  onAddTransaction?: (transaction: Omit<Transaction, "id">) => void;
  onAddGoal?: (goal: Omit<Goal, "id">) => void;
  onUpdateGoal?: (id: string, updates: Partial<Goal>) => void;
  onAddReminder?: (reminder: Omit<Reminder, "id">) => void;
  onSetBaseSalary?: (salary: number) => void;
  onAddCategory?: (category: Omit<Category, "id">) => void;
}

const ChatConsultant: React.FC<ChatConsultantProps> = ({
  state,
  onAddTransaction,
  onAddGoal,
  onUpdateGoal,
  onAddReminder,
  onSetBaseSalary,
  onAddCategory,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para edição manual de chave API no app
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem("securitycash_gemini_key") || "");
  const [keySavedBadge, setKeySavedBadge] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      localStorage.setItem("securitycash_gemini_key", keyInput.trim());
    } else {
      localStorage.removeItem("securitycash_gemini_key");
    }
    setErrorMsg(null);
    setKeySavedBadge(true);
    setTimeout(() => {
      setKeySavedBadge(false);
      setShowKeyModal(false);
    }, 1500);
  };

  // Função para executar ações solicitadas pela IA no estado da loja
  const executeAIAction = (action: AIAction): ExecutedActionResult => {
    const actionType = action.type;
    try {
      if (action.type === "add_transaction") {
        const { transactionType, description, amount, date, categoryName } = action.data;

        let catId = "";
        if (categoryName) {
          const found = state.categories.find(
            (c) =>
              c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
              categoryName.toLowerCase().includes(c.name.toLowerCase())
          );
          if (found) catId = found.id;
        }
        if (!catId) {
          const defaultCat = state.categories.find((c) => c.kind === transactionType);
          if (defaultCat) catId = defaultCat.id;
        }

        const txDate = date || new Date().toISOString().split("T")[0];

        if (onAddTransaction) {
          onAddTransaction({
            type: transactionType || "despesa",
            description: description || "Lançamento via IA",
            amount: Math.abs(amount),
            date: txDate,
            categoryId: catId || (state.categories[0]?.id || ""),
          });
        }

        const label = transactionType === "entrada" ? "Receita" : "Despesa";
        return {
          actionType,
          summary: `${label} de R$ ${Math.abs(amount).toFixed(2)} ("${description}") adicionada!`,
          success: true,
        };
      }

      if (action.type === "add_goal") {
        const { title, targetAmount, currentAmount, deadline } = action.data;
        if (onAddGoal) {
          onAddGoal({
            title: title || "Nova Meta",
            targetAmount: Math.abs(targetAmount),
            currentAmount: currentAmount ? Math.abs(currentAmount) : 0,
            deadline: deadline || undefined,
          });
        }
        return {
          actionType,
          summary: `Meta "${title}" (R$ ${Math.abs(targetAmount).toFixed(2)}) criada!`,
          success: true,
        };
      }

      if (action.type === "update_goal") {
        const { goalTitle, amountToAdd } = action.data;
        const foundGoal = state.goals.find((g) =>
          g.title.toLowerCase().includes(goalTitle.toLowerCase())
        );
        if (foundGoal && onUpdateGoal) {
          const newCurrent = Math.max(0, foundGoal.currentAmount + amountToAdd);
          onUpdateGoal(foundGoal.id, { currentAmount: newCurrent });
          return {
            actionType,
            summary: `Adicionado R$ ${amountToAdd.toFixed(2)} à meta "${foundGoal.title}" (Saldo: R$ ${newCurrent.toFixed(2)})!`,
            success: true,
          };
        } else {
          return {
            actionType,
            summary: `Meta "${goalTitle}" não encontrada no app.`,
            success: false,
          };
        }
      }

      if (action.type === "add_reminder") {
        const { title, amount, dueDate } = action.data;
        if (onAddReminder) {
          onAddReminder({
            title: title || "Lembrete",
            amount: Math.abs(amount),
            dueDate: dueDate || new Date().toISOString().split("T")[0],
            status: "pendente",
          });
        }
        return {
          actionType,
          summary: `Lembrete "${title}" (R$ ${Math.abs(amount).toFixed(2)}) agendado para ${dueDate}!`,
          success: true,
        };
      }

      if (action.type === "set_base_salary") {
        const { amount } = action.data;
        if (onSetBaseSalary) {
          onSetBaseSalary(Math.abs(amount));
        }
        return {
          actionType,
          summary: `Salário base atualizado para R$ ${Math.abs(amount).toFixed(2)}!`,
          success: true,
        };
      }

      if (action.type === "add_category") {
        const { name, kind } = action.data;
        if (onAddCategory) {
          onAddCategory({
            name: name,
            kind: kind || "despesa",
            color: kind === "entrada" ? "#10b981" : "#f43f5e",
          });
        }
        return {
          actionType,
          summary: `Categoria "${name}" (${kind}) criada!`,
          success: true,
        };
      }

      return {
        actionType,
        summary: "Ação concluída com sucesso.",
        success: true,
      };
    } catch (err) {
      console.error("Erro ao executar ação da IA:", err);
      return {
        actionType,
        summary: "Não foi possível executar a ação no aplicativo.",
        success: false,
      };
    }
  };

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

      let executedAction: ExecutedActionResult | undefined;
      if (aiResponse.action) {
        executedAction = executeAIAction(aiResponse.action);
      }

      const newAiMessage: ChatMessage = {
        role: "model",
        parts: [{ text: aiResponse.reply }],
        executedAction,
      };

      setMessages([...updatedMessages, newAiMessage]);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "Desculpe, ocorreu um erro ao obter a resposta."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Deseja encerrar essa sessão e limpar as conversas da tela?")) {
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
          <h3
            key={i}
            className="text-sm font-extrabold mt-5 mb-2 text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-700 pb-1"
          >
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
          <li
            key={i}
            className="ml-4 text-sm text-zinc-700 dark:text-zinc-300 my-0.5 leading-relaxed list-disc pl-1"
          >
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
      title: "Cadastrar um gasto rápido",
      sub: 'Ex: "Adicione uma despesa de R$ 45 com Uber"',
      text: "Adicione uma despesa de R$ 45 com Uber realizada hoje",
      icon: Wand2,
    },
    {
      title: "Alcançar minhas metas",
      sub: "Estratégia personalizada com base nas suas metas",
      text: "Como posso me planejar melhor para alcançar minhas metas atuais no app?",
      icon: TrendingUp,
    },
    {
      title: "Cortar gastos",
      sub: "Análise dos seus lançamentos recentes",
      text: "Analise meus gastos recentes e sugira onde posso economizar sem sofrer.",
      icon: PiggyBank,
    },
    {
      title: "Investir com segurança",
      sub: "Opções adequadas ao seu perfil e saldo atual",
      text: "Com base no meu saldo e renda, qual a melhor forma de criar uma reserva segura?",
      icon: BarChart3,
    },
  ];

  const userName = state.userName || "você";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/70 rounded-3xl overflow-hidden shadow-sm relative">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={16} className="text-white dark:text-zinc-900" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              Meu Assessor Interativo
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight">
              Lê dados e edita o aplicativo em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold transition-all"
            title="Configurar Chave API do Gemini"
          >
            <Key size={13} className="text-amber-500" />
            <span className="hidden sm:inline">Chave Gemini</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-xs font-medium transition-all"
              title="Limpar chat"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Encerrar</span>
            </button>
          )}
        </div>
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
                  Como posso ajudar suas finanças hoje?
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                Além de responder dúvidas, você pode me pedir para **cadastrar gastos**, **criar metas**, **agendar contas** ou **ajustar seu salário**!
              </p>
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
                  <ChevronRight
                    size={15}
                    className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 shrink-0 transition-colors"
                  />
                </button>
              ))}
            </div>

            <p className="text-[11px] text-zinc-300 dark:text-zinc-600 text-center leading-relaxed">
              As análises e ações são executadas em tempo real no seu aplicativo.
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
                  className={`flex gap-3 ${
                    isUser ? "flex-row-reverse" : ""
                  } animate-in fade-in slide-in-from-bottom-1 duration-200`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                      isUser ? "bg-zinc-200 dark:bg-zinc-700" : "bg-zinc-900 dark:bg-white"
                    }`}
                  >
                    {isUser ? (
                      <UserCircle2 size={16} className="text-zinc-500 dark:text-zinc-300" />
                    ) : (
                      <Sparkles size={13} className="text-white dark:text-zinc-900" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="max-w-[85%] space-y-2">
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm ${
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

                    {/* Visual Card for Executed AI Actions */}
                    {!isUser && msg.executedAction && (
                      <div
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs animate-in zoom-in-95 duration-200 ${
                          msg.executedAction.success
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        <CheckCircle2
                          size={15}
                          className={`shrink-0 mt-0.5 ${
                            msg.executedAction.success
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        />
                        <div className="font-medium leading-relaxed">
                          <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5 opacity-80">
                            Ação Executada no App
                          </span>
                          {msg.executedAction.summary}
                        </div>
                      </div>
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
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Processando e analisando...
                  </span>
                </div>
              </div>
            )}

            {/* Error + Inline Key Setup */}
            {errorMsg && (
              <div className="flex flex-col gap-3 p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/20 rounded-2xl animate-in fade-in">
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                      Erro na análise
                    </p>
                    <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5 leading-relaxed">
                      {errorMsg}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Key size={13} />
                  Inserir/Atualizar Chave Gemini Aqui
                </button>
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
            placeholder='Tire dúvidas ou diga ex: "Adicione gasto de R$ 30 com lanche"...'
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

      {/* MODAL CONFIGURAÇÃO DE CHAVE API GEMINI */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in duration-200 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Key size={16} />
                </div>
                <h3 className="text-base font-bold">Chave API do Gemini</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Insira sua chave de API do Gemini para uso direto no seu navegador. Isso substitui instantaneamente qualquer configuração antiga sem precisar refazer o build!
            </p>

            <form onSubmit={handleSaveCustomKey} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Sua Chave API (AQ... ou AIza...)
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Cole sua API Key aqui..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                />
              </div>

              {keySavedBadge && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Check size={14} /> Chave salva com sucesso!
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:opacity-80 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Salvar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatConsultant;
