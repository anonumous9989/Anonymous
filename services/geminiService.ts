
import { GoogleGenAI, Type } from "@google/genai";
import { boardToFen } from "./chessLogic";
import { Square, PieceColor } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChessAdvise = async (board: Square[], turn: PieceColor, history: any[]) => {
  const fen = boardToFen(board, turn);
  const historyText = history.map(m => `${m.from}->${m.to}`).join(', ');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a chess grandmaster. Analyze this position (FEN: ${fen}) and move history: ${historyText}. Provide a strategic suggestion and explain why it's a good move.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedMove: { type: Type.STRING, description: "Move in algebraic notation or from-to format" },
            explanation: { type: Type.STRING, description: "Brief strategic reasoning" },
            evaluation: { type: Type.STRING, description: "Current position evaluation (e.g. +1.5, slightly better for white)" }
          },
          required: ["suggestedMove", "explanation", "evaluation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Advice Error:", error);
    return {
      suggestedMove: "Analysis unavailable",
      explanation: "Unable to reach the grandmaster at this moment.",
      evaluation: "N/A"
    };
  }
};
