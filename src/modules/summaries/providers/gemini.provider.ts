import type { AiProvider } from "./provider.types";

async function errorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.error?.message ?? `Gemini retornou HTTP ${response.status}.`;
  } catch {
    return `Gemini retornou HTTP ${response.status}.`;
  }
}

export const geminiProvider: AiProvider = {
  id: "gemini",
  label: "Gemini",
  async summarize(request, apiKey) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${request.geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Modo: ${request.mode}\nGere uma resposta com resumo, pontos principais e plano de estudo.\n\n${request.input}` }] }]
        })
      }
    );

    if (!response.ok) throw new Error(await errorMessage(response));
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nenhum resumo retornado.";
  }
};
