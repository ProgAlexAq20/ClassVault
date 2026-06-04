# ClassVault

PWA premium para organização acadêmica moderna. A interface segue uma direção visual escura, suave e nativa, com inspiração em Notion, Linear, Arc Browser e Apple Education.

## Stack

- React + TypeScript + Vite
- TailwindCSS + componentes estilo shadcn/ui
- Framer Motion
- Zustand
- TanStack Query
- Firebase Auth, Firestore, Storage e Analytics
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

## Firebase

O login usa Firebase Auth com Google. A sessão é persistida pelo SDK do Firebase e os dados do app ficam separados por `uid` no Firestore, com cache local apenas para leitura rápida e fallback offline.

Para liberar o painel admin em produção, aplique custom claim `admin: true` no usuário por uma função server-side confiável.

As regras versionadas em `firestore.rules` e `storage.rules` isolam dados e arquivos por `request.auth.uid`.

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

## Persistência e webhooks

O projeto persiste registros de acesso dos usuários na coleção `userAccess` do Firestore e dados acadêmicos em subcoleções `users/{uid}/...`.

Passos rápidos para ativar em produção:

- Publique `firestore.rules` e `storage.rules` pelo Firebase CLI.
- Configure um endpoint server-side confiável para webhooks Pix e atualize `userAccess/{uid}.paymentStatus` com Firebase Admin fora do bundle frontend. O endpoint deve rodar com credenciais de serviço e não deve depender da autenticação do usuário no navegador.
- Use `src/api/webhooks/pixWebhook.ts` como contrato tipado de payload/resposta para a integração serverless.

Segurança:
- Use regras do Firestore para impedir que clientes ativem `paymentStatus` diretamente.
- Proteja o endpoint do webhook com validação de assinatura do provedor de pagamento.

## Testes com Emuladores (Firestore + Auth)

Há scripts de teste em `firestore-samples/` para validar regras e gravações usando os emuladores do Firebase.

Requisitos:
- `firebase-tools` instalado (`npm i -g firebase-tools`) e autenticado se desejar deploy real.

Rodar os emuladores e testar (comandos executáveis no workspace):

1) Teste Admin (ignora regras — valida conectividade):
```bash
firebase emulators:exec --project classvaulte "node firestore-samples/emulator-admin-test.cjs"
```

2) Teste Cliente Autenticado (valida regras via Auth Emulator):
```bash
firebase emulators:exec --project classvaulte "node firestore-samples/emulator-client-auth-test.cjs"
```

Observações:
- `firebase.json` já inclui configuração de portas para os emuladores (firestore 8085, auth 9099, hosting 5000, storage 9199).
- Os scripts criam um usuário no Auth Emulator, obtêm um `idToken` e escrevem documentos no Firestore Emulator via REST, validando as `firestore.rules` locais.
- Use `firebase emulators:start` para abrir o painel e inspecionar dados manualmente.

