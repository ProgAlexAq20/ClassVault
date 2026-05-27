import type { AiProvider } from "./provider.types";

export const geminiProvider: AiProvider = {
  id: "gemini",
  label: "Gemini",
  async summarize(request, apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Modo: ${request.mode}\n${request.input}` }] }]
        })
      }
    );

    if (!response.ok) throw new Error("Falha ao chamar Gemini");
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nenhum resumo retornado.";
  }
};
