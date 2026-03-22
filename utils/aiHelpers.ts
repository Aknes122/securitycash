import { GoogleGenerativeAI } from "@google/generative-ai";
import { Category, Transaction, NegotiationMessage } from "../types";

// Obter a instância com a API Key do projeto
const getGenAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave Gemini não configurada");
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Gera um impacto cognitivo ("Horas de Vida") e risco sobre as metas.
 */
export const generateCognitiveImpact = async (
  amount: number,
  baseSalary: number,
  closestGoalName: string | null
): Promise<{ text: string; hours: number }> => {
  try {
    // Calculo basico de horas baseado em ~160h a 200h de trabalho mês (160h é padrao util)
    const hourlyWage = baseSalary / 160;
    const hoursCost = Math.ceil(amount / hourlyWage);

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const goalContext = closestGoalName
      ? `e essa quantia também é o dinheiro que iria para a meta '${closestGoalName}'`
      : `reduzindo a capacidade de poupar no mês`;

    const prompt = `Atue como um educador financeiro provocativo. 
O usuário está preste a fazer um gasto de R$ ${amount.toFixed(2)}. 
O salário base dele é R$ ${baseSalary.toFixed(2)} (renda de R$ ${hourlyWage.toFixed(2)}/hora).
Isso significa que esse gasto custa exatamente ${hoursCost} horas de trabalho da vida dele, ${goalContext}.
Crie UM único alerta (máx 15-20 palavras) muito incisivo, criativo e reflexivo para fazer ele pensar duas vezes antes de gastar. Use um tom amigável mas de "choque de realidade".
Não precisa dar oi, retorne APENAS a frase de alerta de IA. Exemplo: "Esse ifood vai custar 3 horas do seu suor e afastar sua viagem pra praia!".`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    return { text: responseText, hours: hoursCost };
  } catch (error) {
    console.error("Erro na geração de impacto cognitivo:", error);
    // Fallback amigavel caso falte a key ou de erro de internet
    const pseudoWage = Math.max(1, baseSalary / 160);
    const hours = Math.ceil(amount / pseudoWage);
    return {
      text: `Atenção: Este gasto equivale a ${hours} horas do seu intenso trabalho.`,
      hours: hours
    };
  }
};

/**
 * Analisa as transações mensais e gera uma provocação/insight no Dashboard.
 */
export const generateDashboardInsight = async (transactionsContext: string): Promise<string> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Aqui está um resumo recente do comportamento financeiro de um usuário do meu app (incluindo maiores categorias de gasto ou valores listados):
${transactionsContext}
Sua tarefa é agir como o "conselheiro rico e meio sarcástico, porém parceiro".
Gere UMA única frase em português do Brasil, curta (1-2 frases max, máx 25 palavras), analisando esse resumo com um insight provocativo ou elogioso criativo. 
Exemplo: "Você já gastou o equivalente a um celular novo só em Lanches neste mês. Que tal focar na sua reserva?".
A frase deve ser impactante e encorajar controle financeiro (ou elogiar se tiver guardando muito). Retorne SOMENTE a frase, sem aspas.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/['"]/g, '');
  } catch (error) {
    console.error("Erro ao gerar insight do Dashboard:", error);
    return "Lembre-se: O controle da sua mente reflete no controle da sua carteira. Acompanhe os gastos de perto!";
  }
};

/**
 * Gera um roteiro de negociação para despesas fixas (Internet, Telefonia, Aluguel).
 */
export const generateNegotiationScript = async (expenseName: string, averageAmount: number): Promise<string> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Atue como um educador financeiro objetivo e realista.
O usuário precisa ligar para a central de atendimento para tentar baixar a fatura do serviço de "${expenseName}", valor médio atual de R$ ${averageAmount.toFixed(2)}.
Crie um roteiro (script) de ligação telefônica focado numa negociação direta, educada, coerente e muito firme. Sem exageros ou invencionices, use os seguintes passos:
1. Identificação amigável e confirmação de ser bom cliente pagador.
2. A constatação direta que o valor atual está pesado no orçamento.
3. A menção de que possui ofertas melhores de concorrentes da região.
4. O pedido objetivo por um desconto, isenção ou quebra de fidelidade.
Gere APENAS o roteiro pronto para leitura, de forma clara, natural e concisa. Retorne o texto formatado em Markdown simples.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Erro ao gerar script de economia:", error);
  }
};

/**
 * AI 2.0: Converte uma frase natural em um JSON de Transação (Auto-Categorização)
 */
export const parseNaturalLanguageTransaction = async (
  text: string, 
  categories: Category[], 
  currentDateStr: string
): Promise<{ amount: number; description: string; categoryId: string; type: 'despesa'|'entrada'; date: string }[]> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const catsContext = categories.map(c => `ID: ${c.id} | Nome: ${c.name} | Tipo: ${c.kind}`).join('\n');
    
    const prompt = `Você é um robô de extração financeira.
O usuário digitou um texto de desabafo ou de registro financeiro hoje (${currentDateStr}).
Mapeie todas as despesas ou receitas implícitas no texto. Identifique o valor (number), a descrição curta (string), a data provável no formato YYYY-MM-DD (string), e o ID da categoria que melhor encaixa da lista fornecida.
Se foi despesa ou pagamento, type é "despesa". Se recebeu algo, type é "entrada".

Lista de Categorias Disponíveis:
${catsContext}

Texto do usuário: "${text}"

Retorne um array JSON estrito no formato abaixo. APENAS ISSO, SEM MARKDOWN:
[
  { "amount": 10.50, "description": "Lanche da tarde", "categoryId": "ID_AQUI", "type": "despesa", "date": "YYYY-MM-DD" }
]`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = result.response.text();
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Erro no parser natural:", err);
    throw err;
  }
};

/**
 * AI 2.0: Dashboard 360 Analytics (Retorna Health Score, Insight e Extremos de Anomalia)
 */
export const generateAdvancedDashboardInsight = async (
  currentMonthTransactions: Transaction[],
  lastMonthTransactions: Transaction[],
  categories: Category[],
  goalsState: string
): Promise<{ healthScore: number; insight: string; anomaly: string | null }> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const currExpenses = currentMonthTransactions.reduce((acc, t) => t.type === 'despesa' ? acc + t.amount : acc, 0);
    const lastExpenses = lastMonthTransactions.reduce((acc, t) => t.type === 'despesa' ? acc + t.amount : acc, 0);

    const prompt = `Você é um Consultor Financeiro AI.
Analise os dados abaixo (Período Selecionado pelo usuário vs Período Temporal de Equivalência Anterior) e as Metas do usuário para emitir um diagnóstico completo da saúde dele neste recorte de tempo. 

Período Selecionado: Total Despesas R$ ${currExpenses.toFixed(2)}. Transações: ${JSON.stringify(currentMonthTransactions.slice(0, 5))}...
Período Anterior Equivalente: Total Despesas R$ ${lastExpenses.toFixed(2)}. 
Resumo de Metas Atuais: ${goalsState}

Com base na relação entre a oscilação de despesas do período selecionado em relação à média/anterior, possíveis gastos estranhos e o progresso das metas, crie:
1. "healthScore": uma nota (0 a 100) que julga a responsabilidade financeira neste período.
2. "insight": uma frase sarcástica, porém analítica e educativa (máx 30 palavras) dizendo como ele está (se piorou x melhorou) no recorte de tempo e uma dica.
3. "anomaly": uma frase de alerta citando um gasto estranho ou atípico do período selecionado, ou NULL se não houver.

Retorne SOMENTE um objeto JSON nesse formato rígido:
{
  "healthScore": 85,
  "insight": "Seu texto...",
  "anomaly": "Seu texto de alerta ou nulo"
}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.response.text());
  } catch (err) {
    console.error("Erro no Super Dashboard:", err);
    return {
      healthScore: 70,
      insight: "Tente focar na manutenção do controle. Evite despesas variáveis excessivas este fim de semana.",
      anomaly: null
    };
  }
};

/**
 * AI 3.0: Motor de Negociação em Tempo Real (Estilo FBI / Chris Voss)
 */
export const continueNegotiationChat = async (
  serviceName: string,
  currentAmount: number,
  targetAmount: number,
  history: NegotiationMessage[],
  userRebuttal: string
): Promise<{ script: string, status: 'active' | 'won' | 'lost' }> => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: `Você é um Consultor de Negociação de elite, treinado nas técnicas de Chris Voss (ex-negociador chefe do FBI).
O usuário quer negociar com empresa que fornece "${serviceName}".
Elê paga atualmente R$ ${currentAmount}/mês e quer chegar a R$ ${targetAmount}/mês.

Sua missão: gerar um SCRIPT exato para o usuário FALAR ou COPIAR agora.

Táticas que você domina:
- Empatia Tática: Comece sempre com rótulos emocionais ("Parece que...") para criar rapport
- Ancoragem firme: Repita o valor alvo com calma. Nunca ceda ao primeiro contra-valor
- Perguntas calibradas "Como" e "O Quê" que forçam o atendente a trabalhar por você
- CARTA NA MANGA — Améaca de Cancelamento (use com parcimônia): Só use esta tática se o atendente já recusou firmemente 2 ou mais vezes E a conversa parece travada. Ameace cancelar de forma calma e definitiva. Não use isso na abertura nem repita mais de uma vez — perde o efeito. É uma carta que só funciona quando bem cronometrada.
- Silêncio e repetição: Repetir o valor alvo sem justificar também é uma tática válida.

Regras de status:
- Sempre retorne status: "active" a menos que o atendente CONFIRME EXPLICITAMENTE o valor alvo (R$ ${targetAmount} ou menor)
- Se confirmado o valor alvo: retorne status: "won" com uma frase de agradecimento gentil
- NUNCA retorne status: "lost". Apenas o usuário pode encerrar uma negociação como perdida.

Retorne APENAS este JSON:
{
  "script": "a frase exata para falar agora, direto ao ponto",
  "status": "active" | "won"
}`
    });

    const contents: Array<{ role: 'user' | 'model', parts: [{ text: string }] }> = [];

    // Empilhar histórico
    const validHistory = history.filter(h => h.role !== 'system');
    for (const msg of validHistory) {
      contents.push({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Se é a primeira mensagem, injeta o setup. Se não, injeta o rebuttal do vendedor.
    let nextPrompt = "";
    if (history.length === 0) {
      nextPrompt = "Olá, estou pronto para iniciar a negociação. Qual a minha exata frase de abertura para ligar lá agora?";
    } else {
      nextPrompt = `O vendedor respondeu exatamente isso: "${userRebuttal}"\n Qual é minha tréplica tática agora? Apenas a frase a ser dita.`;
    }

    contents.push({ role: 'user', parts: [{ text: nextPrompt }] });

    const result = await model.generateContent({ 
      contents,
      generationConfig: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error("Erro no chat de negociação:", err);
    return {
      script: "Lamento, perdi o sinal tático. Diga a ele: 'Como eu posso resolver isso se o preço continua inviável para mim?'",
      status: 'active' as const
    };
  }
};
