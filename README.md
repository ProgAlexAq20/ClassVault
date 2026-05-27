# ClassVault

PWA premium para organização acadêmica moderna. A interface segue uma direção visual escura, suave e nativa, com inspiração em Notion, Linear, Arc Browser e Apple Education.

## Stack

- React + TypeScript + Vite
- TailwindCSS + componentes estilo shadcn/ui
- Framer Motion
- Zustand
- TanStack Query
- Supabase
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
- nunca salva no Supabase
- nunca fica hardcoded
- providers separados em `src/modules/summaries/providers`

Providers preparados:

- OpenAI
- Gemini
- Groq

## Supabase

O schema relacional está em `supabase/schema.sql` e cobre:

- classrooms
- lessons
- files
- notes
- tasks
- events
- summaries

As políticas RLS isolam dados por usuário autenticado.

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

Configure `.env` a partir de `.env.example` para usar Supabase real.
