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
