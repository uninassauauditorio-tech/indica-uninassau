
import { GoogleGenAI, Type } from "@google/genai";
import { Referral } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async analyzeReferral(referral: Referral) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o perfil deste aluno indicado e sugira uma abordagem personalizada de vendas:
        Nome: ${referral.studentName}
        Curso: ${referral.course}
        Notas: ${referral.notes || 'Nenhuma nota adicional'}
        Status atual: ${referral.status}
        
        Forneça uma análise curta e 3 pontos chave para a abordagem em Português.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return "Não foi possível realizar a análise no momento.";
    }
  },

  async generateFollowUpMessage(referral: Referral) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma mensagem curta e profissional de acompanhamento para o WhatsApp para o aluno:
        Nome: ${referral.studentName}
        Curso: ${referral.course}
        Contexto: Ele foi indicado pelo colaborador ${referral.referrerName}.
        
        A mensagem deve ser amigável, convidativa e em Português do Brasil.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Message Error:", error);
      return "Olá! Gostaríamos de conversar sobre sua indicação para o curso.";
    }
  }
};
