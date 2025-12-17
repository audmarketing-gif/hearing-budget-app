import { GoogleGenAI } from "@google/genai";
import { Transaction, Budget } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  transactions: Transaction[],
  budgets: Budget[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI insights are unavailable. Please configure your API Key.";
  }

  const expenseSummary = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeSummary = transactions
    .filter(t => t.type === 'allocation')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const budgetSummary = budgets.reduce((acc, curr) => {
    acc[curr.category] = curr.limit;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    You are a Strategic Marketing Budget Analyst for a corporate team. Analyze the following financial data.
    Focus on "Burn Rate", "Channel Efficiency", and "Budget Pacing".
    
    Data:
    Campaign Spend by Category: ${JSON.stringify(expenseSummary)}
    Funding/Allocation Sources: ${JSON.stringify(incomeSummary)}
    Channel Budget Caps: ${JSON.stringify(budgetSummary)}
    
    Please provide:
    1. An assessment of the current burn rate against the allocated funding.
    2. Identify any marketing channels (categories) that are overspending their cap.
    3. Recommendations for reallocation (e.g., if Paid Media is high but Content is low, suggest balancing).
    
    Keep the tone professional, data-driven, and concise. Use marketing terminology (e.g., "Spend," "Allocation," "Q1 Goals"). Format with clear bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while analyzing your team's budget. Please try again later.";
  }
};