import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState, AIAction, ExecutedActionResult } from "../types";

// Get Gemini instance
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCpX4eyDZlWDuMt1PlTXAA-nCDOD-ZXnJI";
  return new GoogleGenerativeAI(apiKey);
};

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
  timestamp?: number;
  executedAction?: ExecutedActionResult;
}

export interface AIChatResponse {
  reply: string;
  action: AIAction | null;
}

/**
 * Builds a personalized system prompt with context from the user's financial state
 */
export const buildSystemPrompt = (state: AppState): string => {
  const baseSalary = state.baseSalary || 3000;
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate total incomes and expenses for context
  const totalIncomes = state.transactions
    .filter((t) => t.type === "entrada")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = state.transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalIncomes - totalExpenses;

  // Format categories
  const categoriesList = state.categories && state.categories.length > 0
    ? state.categories.map(c => `- Categoria: "${c.name}" | Tipo: ${c.kind} | ID: ${c.id}`).join("\n")
    : "Nenhuma categoria cadastrada.";

  // Format active goals
  const activeGoals = state.goals && state.goals.length > 0
    ? state.goals.map(g => `- Meta: "${g.title}" | Objetivo: R$ ${g.targetAmount.toFixed(2)} | Já poupado: R$ ${g.currentAmount.toFixed(2)}`).join("\n")
    : "Nenhuma meta cadastrada no momento.";

  // Format active installments
  const activeInstallments = state.installments && state.installments.length > 0
    ? state.installments.filter(i => i.status === "ativo").map(i => `- Parcelamento: "${i.title}" | ${i.paidInstallments}/${i.totalInstallments} parcelas de R$ ${i.amountPerInstallment.toFixed(2)}`).join("\n")
    : "Nenhum parcelamento ativo.";

  // Format recent transactions (last 10)
  const recentTransactions = state.transactions && state.transactions.length > 0
    ? state.transactions.slice(0, 10).map(t => `- [${t.date}] ${t.description} | R$ ${t.amount.toFixed(2)} | Tipo: ${t.type}`).join("\n")
    : "Nenhuma transação recente registrada.";

  return `Você é o "Security Cash Coach", um consultor financeiro pessoal inteligente e especialista em investimentos altamente qualificado, integrado diretamente ao aplicativo Security Cash.
Data de Hoje: ${todayStr}

Seu papel é auxiliar o usuário a organizar suas finanças, responder suas dúvidas e EXECUTAR AÇÕES no aplicativo quando solicitado.

Abaixo está o perfil financeiro em tempo real do usuário:
- Salário Base Mensal: R$ ${baseSalary.toFixed(2)}
- Entradas Totais Registradas: R$ ${totalIncomes.toFixed(2)}
- Despesas Totais Registradas: R$ ${totalExpenses.toFixed(2)}
- Saldo Líquido Atual do App: R$ ${currentBalance.toFixed(2)}

Categorias Existentes:
${categoriesList}

Metas Ativas do Usuário:
${activeGoals}

Parcelamentos Ativos:
${activeInstallments}

Últimos Lançamentos Financeiros:
${recentTransactions}

--- CAPACIDADE DE EXECUTAR AÇÕES NO APLICATIVO ---
Se o usuário pedir para criar, cadastrar, alterar, depositar ou ajustar algo no aplicativo (ex: "adicione um gasto de R$ 50", "crie uma meta de R$ 3000", "depositei R$ 200 na meta Viagem", "me lembre de pagar R$ 100 dia 15", "mude meu salário para R$ 4500", "crie a categoria Pets"), você DEVE gerar uma resposta JSON estrita contendo o campo "action".

FORMATO DE RESPOSTA (OBRIGATÓRIO FORMATO JSON ESTRITO):
Retorne SEMPRE um JSON válido com o seguinte formato:
{
  "reply": "Sua resposta amigável em Português do Brasil com formatação Markdown indicando o que você respondeu ou executou.",
  "action": null OU um objeto de ação conforme os tipos abaixo
}

TIPOS DE AÇÕES SUPORTADAS EM "action":

1. Adicionar Transação (gasto ou ganho):
{
  "type": "add_transaction",
  "data": {
    "transactionType": "despesa" ou "entrada",
    "description": "Descrição curta (ex: Almoço, Uber, Salário)",
    "amount": 50.00,
    "date": "YYYY-MM-DD" (se não fornecido, use "${todayStr}"),
    "categoryName": "Nome aproximado de uma categoria existente ou nova"
  }
}

2. Criar Nova Meta:
{
  "type": "add_goal",
  "data": {
    "title": "Nome da Meta",
    "targetAmount": 3000.00,
    "currentAmount": 0,
    "deadline": "YYYY-MM-DD" (opcional)
  }
}

3. Depositar / Atualizar Progresso de Meta Existente:
{
  "type": "update_goal",
  "data": {
    "goalTitle": "Nome da meta a atualizar",
    "amountToAdd": 200.00
  }
}

4. Adicionar Lembrete / Conta a Pagar:
{
  "type": "add_reminder",
  "data": {
    "title": "Conta de Luz",
    "amount": 150.00,
    "dueDate": "YYYY-MM-DD"
  }
}

5. Alterar Salário Base:
{
  "type": "set_base_salary",
  "data": {
    "amount": 5000.00
  }
}

6. Criar Categoria:
{
  "type": "add_category",
  "data": {
    "name": "Nome da Categoria",
    "kind": "despesa" ou "entrada"
  }
}

Se o usuário apenas fez uma pergunta ou bateu papo sem pedir uma criação/alteração, defina "action": null.

Diretrizes de Resposta ("reply"):
1. Seja motivador, empático, realista e direto.
2. Dê conselhos práticos e específicos.
3. Se falar de investimentos, inclua um disclaimer amigável no final informando que são sugestões educativas.
4. Use formatação Markdown (negritos estratégicos, tópicos) no campo "reply".
5. Mantenha o campo "reply" conciso e agradável.
6. Responda estritamente em Português do Brasil.`;
};

/**
 * Sends a chat message to Gemini with conversation history and system instructions.
 */
export const sendChatMessage = async (
  message: string,
  history: ChatMessage[],
  state: AppState
): Promise<AIChatResponse> => {
  try {
    const genAI = getGenAI();
    const systemPrompt = buildSystemPrompt(state);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    // Clean up history to pass to Gemini API
    const cleanHistory = history.map((h) => ({
      role: h.role,
      parts: h.parts.map(p => ({ text: p.text })),
    }));

    const chat = model.startChat({
      history: cleanHistory,
    });

    const result = await chat.sendMessage(message);
    const text = result.response.text();
    
    try {
      const parsed = JSON.parse(text);
      return {
        reply: parsed.reply || text,
        action: parsed.action || null
      };
    } catch {
      return {
        reply: text,
        action: null
      };
    }
  } catch (error) {
    console.error("Erro na comunicação com o Consultor IA:", error);
    throw new Error(
      error instanceof Error ? error.message : "Erro desconhecido ao falar com o Consultor IA."
    );
  }
};
