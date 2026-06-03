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

## Segurança recomendada (rápido)

- **Authorized domains / origins:** No Firebase Console -> Authentication -> Sign-in method -> Authorized domains, adicione seus domínios (`localhost`, domínio de produção, etc.).
- **Authorized origins/redirects no Google Cloud:** Em APIs & Services -> Credentials -> OAuth 2.0 Client IDs, configure *Authorized JavaScript origins* (ex.: `http://localhost:5173`, `https://seu-dominio.com`) e *Authorized redirect URIs* (ex.: `https://<project>.firebaseapp.com/__/auth/handler`).
- **VITE_ALLOWED_ORIGINS:** preencha no `.env` com as origins permitidas para evitar inicializar o Firebase em domínios inesperados.
- **Não comitar segredos:** As variáveis do Firebase ficam em `.env*` e **não** devem ser commitadas. O repositório já ignora `.env`.
- **HSTS e headers:** Ao publicar (Netlify, Vercel, Cloud Run, etc.), ative HSTS, CSP e outros headers no nível do host para proteção adicional.

## Persistência de usuários e webhooks

O projeto agora persiste registros de acesso dos usuários na coleção `userAccess` do Firestore quando o Firebase estiver configurado. Além disso há um handler de webhook (`src/api/webhooks/pixWebhook.ts`) que pode ser implantado como função serverless para atualizar o `paymentStatus`.

Passos rápidos para ativar em produção:

- Configure Firestore no Firebase Console e ajuste regras para proteger a coleção `userAccess` (leitura/escrita restrita a contas administrativas ou funções serverless).
- Para o webhook (Cloud Function / Cloud Run / outro), defina a variável de ambiente `FIREBASE_SERVICE_ACCOUNT_JSON` com o conteúdo JSON da service account (não comite isso). Exemplo (Unix):

```bash
export FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account", ...}'
```

- Ao receber um webhook, o handler tenta identificar o usuário por `uid` ou por `email` no payload e marca `paymentStatus` como `active`.

Segurança:
- Use regras do Firestore para impedir que clientes atualizem `paymentStatus` diretamente.
- Proteja o endpoint do webhook com validação de assinatura do provedor de pagamento.
