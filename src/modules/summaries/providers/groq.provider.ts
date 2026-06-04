import type { AiProvider } from "./provider.types";

async function errorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.error?.message ?? `Groq retornou HTTP ${response.status}.`;
  } catch {
    return `Groq retornou HTTP ${response.status}.`;
  }
}

export const groqProvider: AiProvider = {
  id: "groq",
  label: "Groq",
  async summarize(request, apiKey) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { role: "system", content: "Voce transforma material academico em resumos acionaveis em portugues." },
          { role: "user", content: `Modo: ${request.mode}\n${request.input}` }
        ]
      })
    });

    if (!response.ok) throw new Error(await errorMessage(response));
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "Nenhum resumo retornado.";
  }
};
