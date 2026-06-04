# Relatório de Correção - Erro Firestore Undefined

## Problema Identificado

**Erro:** `Function setDoc() called with invalid data. Unsupported field value: undefined`

**Causa:** O Firestore não aceita valores `undefined` em documentos. Campos opcionais como `dueTime`, `description`, `subjectId`, etc., estavam sendo salvos como `undefined` ao invés de `null` ou serem omitidos.

## Solução Implementada

### 1. Criação de Utilitário de Limpeza

**Arquivo:** `src/shared/utils/firestore-helpers.ts`

Criadas três funções auxiliares:

- **`cleanFirestoreData()`**: Remove campos `undefined` de objetos antes de salvar no Firestore
- **`nullableString()`**: Converte strings vazias/undefined para `null`
- **`optionalString()`**: Converte strings vazias/undefined para `undefined` (para serem omitidas)

### 2. Correções no Store Principal

**Arquivo:** `src/shared/store/vault-data.store.ts`

#### Alterações em `addTask`:
- Normaliza `dueTime` para `null` quando vazio (linha 548)
- Usa `cleanFirestoreData()` ao salvar no Firestore (linha 569)
- Garante que `dueTime: null` seja enviado ao invés de `undefined`

#### Alterações em `editTask`:
- Normaliza `dueTime` para `null` quando vazio (linha 596)
- Usa `cleanFirestoreData()` ao atualizar no Firestore (linha 615)
- Preserva `null` ao invés de `undefined` para campos opcionais

#### Alterações em `addLesson`:
- Usa `cleanFirestoreData()` ao salvar (linha 485)
- Remove campos `undefined` automaticamente

#### Alterações em `addEvent`:
- Usa `cleanFirestoreData()` ao salvar (linha 679)
- Remove campos `undefined` automaticamente

### 3. Correções no Componente de Tarefas

**Arquivo:** `src/modules/tasks/components/TaskDetailsDialog.tsx`

#### Alterações em `handleSave`:
- Normaliza `dueTime` antes de enviar (linha 121)
- Garante que string vazia seja convertida para `undefined`

## Campos Corrigidos

✅ **dueTime** - Agora salvo como `null` quando vazio
✅ **description** - Sempre string (vazia se não preenchida)
✅ **priority** - Sempre definido com valor padrão
✅ **subjectId** - Normalizado corretamente
✅ **progress** - Sempre número válido (0-100)

## Operações Testadas

✅ Criar nova tarefa
✅ Editar tarefa existente
✅ Atualizar progresso de tarefa
✅ Concluir tarefa (marcar como done)
✅ Criar aula (lesson)
✅ Criar evento (event)

## Arquivos Modificados

1. **src/shared/utils/firestore-helpers.ts** (NOVO)
   - Utilitários para limpeza de dados do Firestore

2. **src/shared/store/vault-data.store.ts**
   - Importação do `cleanFirestoreData`
   - Correção em `addTask` (linhas 544-577)
   - Correção em `editTask` (linhas 593-641)
   - Correção em `addLesson` (linhas 485-492)
   - Correção em `addEvent` (linhas 679-686)

3. **src/modules/tasks/components/TaskDetailsDialog.tsx**
   - Correção em `handleSave` (linhas 115-141)

## Resultado

✅ Build compilado com sucesso
✅ Nenhum erro de TypeScript
✅ Todas as operações de Firestore agora seguras contra `undefined`
✅ Compatibilidade mantida com dados existentes

## Prevenção Futura

A função `cleanFirestoreData()` pode ser usada em qualquer operação de Firestore para garantir que valores `undefined` sejam automaticamente removidos antes de salvar.

**Padrão recomendado:**
```typescript
await setDoc(docRef, cleanFirestoreData({
  campo1: valor1,
  campoOpcional: valorOpcional, // pode ser undefined
  serverTimestamp: serverTimestamp() // preservado
}));
```

---

**Data:** 04/06/2026
**Status:** ✅ Concluído e testado

---

# Correção - Firestore Permissions e Storage CORS

## Problemas Encontrados

1. O frontend ainda tentava criar/atualizar `userAccess/{uid}` com metadados do usuário e campos sensíveis como `isAdmin`/`paymentStatus`.
2. `userAccess/{uid}` permitia escrita do próprio usuário, inclusive transição de `beta` para `pending`.
3. O perfil editável do usuário não estava separado do documento sensível de acesso/pagamento.
4. O caminho físico do upload no Storage não seguia o formato `users/{uid}/files/{fileId}/{fileName}`.
5. O Firebase Storage ainda não está inicializado no projeto `classvaulte`, então o deploy de Storage rules e a aplicação de CORS dependem de ativação no Console Firebase.

## Correções Aplicadas

### Auth e Perfil

- Login agora cria/atualiza somente `users/{uid}`.
- `userAccess/{uid}` passou a ser somente leitura para o próprio usuário.
- O frontend não escreve mais `paymentStatus` nem `isAdmin` como usuário comum.
- O botão "Já paguei" registra apenas `premiumReviewStatus: "pending"` em `users/{uid}`.
- O status premium/admin continua vindo de `userAccess/{uid}`.
- Admin com custom claim pode alterar `userAccess/{uid}` pelo painel admin.

### Firestore Rules

- Adicionado match para `users/{uid}`.
- `users/{uid}` permite leitura/escrita do próprio perfil.
- Admin pode listar/ler perfis para busca por email.
- `userAccess/{uid}` permite leitura do próprio usuário ou admin.
- `userAccess/{uid}` permite escrita apenas para admin.
- Escrita comum em `paymentStatus`/`isAdmin` foi bloqueada.

### Storage

- Upload agora usa o caminho:

```text
users/{uid}/files/{fileId}/{fileName}
```

- Rules de Storage foram ajustadas para permitir upload/leitura/exclusão apenas pelo dono.
- Criado `storage.cors.json` com as origens e headers necessários.

## Bucket Configurado

O app está configurado com:

```env
VITE_FIREBASE_STORAGE_BUCKET=classvaulte.firebasestorage.app
```

Esse bucket está consistente com o `firebaseConfig`, mas o Firebase CLI retornou:

```text
Firebase Storage has not been set up on project 'classvaulte'.
```

É necessário abrir:

```text
https://console.firebase.google.com/project/classvaulte/storage
```

e clicar em **Get Started** antes de publicar Storage rules ou aplicar CORS.

## Comandos Executados

```bash
npm run lint
npm run build
firebase deploy --only firestore:rules --project classvaulte
```

Resultado:

- Lint: sucesso
- Build: sucesso
- Firestore rules: publicadas com sucesso
- Storage rules/CORS: bloqueado até ativar Firebase Storage no Console

## Comando Para Aplicar CORS

Após ativar Storage no Firebase Console, aplicar:

```bash
gcloud storage buckets update gs://classvaulte.firebasestorage.app --cors-file=storage.cors.json
```

Alternativa com `gsutil`:

```bash
gsutil cors set storage.cors.json gs://classvaulte.firebasestorage.app
```

Depois publicar rules do Storage:

```bash
firebase deploy --only storage --project classvaulte
```

## Fluxo Final

1. Login Google autentica no Firebase Auth.
2. Frontend cria/atualiza perfil em `users/{uid}`.
3. Frontend lê `userAccess/{uid}` para saber `paymentStatus` e `isAdmin`.
4. Usuário comum não altera `paymentStatus` nem `isAdmin`.
5. "Já paguei" registra solicitação em `users/{uid}`.
6. Admin/backend atualiza `userAccess/{uid}.paymentStatus`.
7. Upload salva arquivo físico no Storage em `users/{uid}/files/{fileId}/{fileName}`.
8. Metadados do arquivo são salvos no Firestore em `users/{uid}/files/{fileId}`.
