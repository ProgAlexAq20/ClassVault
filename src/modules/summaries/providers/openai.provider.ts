import type { AiProvider } from "./provider.types";

async function errorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.error?.message ?? `OpenAI retornou HTTP ${response.status}.`;
  } catch {
    return `OpenAI retornou HTTP ${response.status}.`;
  }
}

export const openAiProvider: AiProvider = {
  id: "openai",
  label: "OpenAI",
  async summarize(request, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Voce e um assistente academico. Responda em portugues brasileiro com clareza e estrutura." },
          { role: "user", content: `Modo: ${request.mode}\nFonte: ${request.sourceName ?? "texto"}\n\n${request.input}` }
        ]
      })
    });

    if (!response.ok) throw new Error(await errorMessage(response));
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "Nenhum resumo retornado.";
  }
};
