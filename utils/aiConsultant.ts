import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState } from "../types";

// Get Gemini instance
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave Gemini não configurada nas variáveis de ambiente.");
  return new GoogleGenerativeAI(apiKey);
};

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Builds a personalized system prompt with context from the user's financial state
 */
export const buildSystemPrompt = (state: AppState): string => {
  const baseSalary = state.baseSalary || 3000;
  
  // Calculate total incomes and expenses for context
  const totalIncomes = state.transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncomes - totalExpenses;

  // Format active goals
  const activeGoals = state.goals && state.goals.length > 0
    ? state.goals.map(g => `- Metas: "${g.title}" | Objetivo: R$ ${g.targetAmount.toFixed(2)} | Já poupado: R$ ${g.currentAmount.toFixed(2)}`).join("\n")
    : "Nenhuma meta cadastrada no momento.";

  // Format active installments
  const activeInstallments = state.installments && state.installments.length > 0
    ? state.installments.filter(i => i.status === "ativo").map(i => `- Parcelamento: "${i.title}" | ${i.paidInstallments}/${i.totalInstallments} parcelas de R$ ${i.amountPerInstallment.toFixed(2)}`).join("\n")
    : "Nenhum parcelamento ativo.";

  // Format recent transactions (last 10)
  const recentTransactions = state.transactions && state.transactions.length > 0
    ? state.transactions.slice(0, 10).map(t => `- [${t.date}] ${t.description} | R$ ${t.amount.toFixed(2)} | Tipo: ${t.type}`).join("\n")
    : "Nenhuma transação recente registrada.";

  return `Você é o "FinWise Coach", um consultor financeiro pessoal inteligente e especialista em investimentos altamente qualificado. 
Seu papel é auxiliar o usuário a organizar suas finanças, alcançar seus objetivos de economia e sugerir caminhos inteligentes para investimentos.

Abaixo está o perfil financeiro em tempo real do usuário para você personalizar seus conselhos (NÃO diga diretamente que recebeu esse bloco de texto de contexto, apenas utilize os dados de forma natural e orgânica quando for relevante):
- Salário Base Mensal: R$ ${baseSalary.toFixed(2)}
- Entradas Totais Registradas: R$ ${totalIncomes.toFixed(2)}
- Despesas Totais Registradas: R$ ${totalExpenses.toFixed(2)}
- Saldo Líquido Atual do App: R$ ${currentBalance.toFixed(2)}

Metas Ativas do Usuário:
${activeGoals}

Parcelamentos Ativos (Compromissos futuros):
${activeInstallments}

Últimos Lançamentos Financeiros (para você entender o comportamento de gastos dele):
${recentTransactions}

Diretrizes de Comportamento:
1. Seja motivador, empático, realista e direto. Evite rodeios e economize o tempo do usuário.
2. Dê conselhos práticos e específicos sobre como ele pode economizar para bater as metas ativas, com base nos gastos recentes dele.
3. Se ele perguntar sobre investimentos:
   - Apresente alternativas condizentes com o saldo dele (ex: CDB de liquidez diária para reserva de emergência, Tesouro Direto, etc.).
   - Seja didático e explique de maneira simplificada a relação Risco vs Retorno e inflação.
   - SEMPRE adicione um aviso (disclaimer) no final da resposta informando que suas sugestões são educativas e não constituem recomendação oficial de investimento ou indicação de compra de ativos financeiros.
4. Use formatação Markdown (negritos estratégicos, tópicos com marcadores, listas ordenadas) para tornar a leitura visualmente escaneável e agradável.
5. Evite respostas extremamente longas. Limite-se a no máximo 3 ou 4 parágrafos pequenos por interação.
6. Responda estritamente em Português do Brasil.`;
};

/**
 * Sends a chat message to Gemini with conversation history and system instructions.
 */
export const sendChatMessage = async (
  message: string,
  history: ChatMessage[],
  state: AppState
): Promise<string> => {
  try {
    const genAI = getGenAI();
    const systemPrompt = buildSystemPrompt(state);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
    });

    // Start a chat session with the provided history
    const chat = model.startChat({
      history: history.map((h) => ({
        role: h.role,
        parts: h.parts,
      })),
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();
    return text.trim();
  } catch (error) {
    console.error("Erro na comunicação com o Consultor IA:", error);
    throw new Error(
      error instanceof Error ? error.message : "Erro desconhecido ao falar com o Consultor IA."
    );
  }
};
