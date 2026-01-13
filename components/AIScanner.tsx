
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Sparkles, AlertCircle, ShieldCheck, X, FileText } from 'lucide-react';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Category, Transaction } from '../types';

interface AIScannerProps {
  categories: Category[];
  onScanComplete: (data: Partial<Transaction>) => void;
  onClose: () => void;
}

const AIScanner: React.FC<AIScannerProps> = ({ categories, onScanComplete, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (base64Data: string) => {
    setIsProcessing(true);
    setError(null);
    setNeedsAuth(false);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setNeedsAuth(true);
        throw new Error("API Key missing");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      // Upgrading to gemini-2.0-flash as 1.5 is not available for this key
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }, { apiVersion: 'v1beta' });

      const base64Content = base64Data.split(',')[1];

      // Simple prompt as requested
      const prompt = 'Analise este cupom fiscal e retorne apenas os dados: valor_total (number), data (ISO string) e estabelecimento em formato JSON puro.';

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64Content } }
      ]);

      let resultText = result.response.text();
      // Thorough cleaning of markdown and extra text
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedData = JSON.parse(resultText);

      // Category Mapping Logic
      const establishment = (parsedData.estabelecimento || '').toLowerCase();
      let suggestedCatId = categories[0].id;

      if (establishment.includes('posto') || establishment.includes('branca') || establishment.includes('gasolina') || establishment.includes('shell') || establishment.includes('ipiranga')) {
        const transportCat = categories.find(c => c.name.toLowerCase().includes('transporte'));
        if (transportCat) suggestedCatId = transportCat.id;
      } else if (establishment.includes('mercado') || establishment.includes('super') || establishment.includes('comida') || establishment.includes('restaurante')) {
        const foodCat = categories.find(c => c.name.toLowerCase().includes('alimentação') || c.name.toLowerCase().includes('mercado'));
        if (foodCat) suggestedCatId = foodCat.id;
      } else if (establishment.includes('farmacia') || establishment.includes('drogaria') || establishment.includes('medico')) {
        const healthCat = categories.find(c => c.name.toLowerCase().includes('saúde'));
        if (healthCat) suggestedCatId = healthCat.id;
      }

      onScanComplete({
        amount: parsedData.valor_total || parsedData.valor || 0,
        description: parsedData.estabelecimento || 'Gasto IA',
        date: parsedData.data ? (parsedData.data.includes('T') ? parsedData.data.split('T')[0] : parsedData.data) : new Date().toISOString().split('T')[0],
        categoryId: suggestedCatId,
        type: 'despesa'
      });
    } catch (err: any) {
      console.error("AI Scan Error:", err);

      const errorMsg = err.message || err.toString();

      if (err.message === "API Key missing") {
        setError("ERRO: Chave de API não encontrada no .env.local. Verifique VITE_GEMINI_API_KEY.");
      } else if (errorMsg.includes("401") || errorMsg.includes("Key not valid")) {
        setError("Chave de API do Gemini inválida ou não autorizada. Verifique no AI Studio.");
      } else {
        setError(`Erro: ${errorMsg}`);
      }
      console.error("Full Error Details:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Viewfinder Compact */}
      <div className="relative h-48 w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-center overflow-hidden group">
        {imagePreview ? (
          <div className="relative w-full h-full">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 pointer-events-none border-4 border-blue-500/50 m-4 rounded-2xl" />
            <button
              onClick={() => { setImagePreview(null); setError(null); }}
              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto text-blue-500">
              <Camera size={20} />
            </div>
            <p className="text-xs text-zinc-400 font-medium max-w-[150px] mx-auto">
              Fotografe o comprovante
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3 animate-in fade-in">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
            <p className="text-white text-xs font-bold uppercase tracking-widest">Processando...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl flex items-start gap-3 text-[10px] border bg-rose-500/10 border-rose-500/20 text-rose-500">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Galeria
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Camera size={16} /> Câmera
        </button>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
              processImage(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      <div className="flex flex-col items-center justify-center gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles size={10} className="text-emerald-500" />
          <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Powered by Gemini</p>
        </div>
        <p className="text-[8px] text-zinc-300">
          Status da IA: {import.meta.env.VITE_GEMINI_API_KEY ? <span className="text-emerald-500">Pronta</span> : <span className="text-rose-500">Configuração Necessária</span>}
        </p>
      </div>
    </div>
  );
};

export default AIScanner;
