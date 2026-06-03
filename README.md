# ClassVault

PWA premium para organização acadêmica moderna. A interface segue uma direção visual escura, suave e nativa, com inspiração em Notion, Linear, Arc Browser e Apple Education.

## Stack

- React + TypeScript + Vite
- TailwindCSS + componentes estilo shadcn/ui
- Framer Motion
- Zustand
- TanStack Query
- Firebase Auth
- vite-plugin-pwa

## Arquitetura

O projeto é modular por feature:

```txt
src/
  modules/
    classrooms/
    notes/
    files/
    calendar/
    summaries/
    dashboard/
    tasks/
  shared/
    components/
    hooks/
    services/
    layouts/
    utils/
```

Cada módulo possui `components`, `hooks`, `services`, `store`, `types` e `pages` para separar UI, estado, integrações e contratos.

## IA BYOK

O ClassVault usa Bring Your Own API Key:

- a chave é colada pelo usuário
- salva apenas localmente
- criptografada com Web Crypto API
- nunca sai do navegador
- nunca fica hardcoded
- providers separados em `src/modules/summaries/providers`

Providers preparados:

- OpenAI
- Gemini
- Groq

## Firebase Auth

O login usa Firebase Auth com Google. A sessão é persistida pelo SDK do Firebase e os dados do app ficam separados por `uid` no armazenamento local do navegador.

Para liberar o painel admin local, preencha `VITE_FIREBASE_ADMIN_EMAILS` com emails separados por vírgula.

## PWA e offline

`vite-plugin-pwa` está configurado com:

- manifest
- ícones
- auto update
- cache de assets
- NetworkFirst para documentos
- StaleWhileRevalidate para assets

Próximos incrementos naturais:

- fila offline para criação de notas/tarefas
- IndexedDB para cache editável
- notificações agendadas para eventos
- sync quando voltar online

## Executar

```bash
npm install
npm run dev
```

Configure `.env` a partir de `.env.example` com as variáveis do Firebase.
