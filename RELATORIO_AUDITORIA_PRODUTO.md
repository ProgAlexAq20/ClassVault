# Relatorio de Auditoria do ClassVault

## Problemas Encontrados

- Trabalhos nao tinham campo de descricao, nem edicao posterior com contexto completo.
- O fluxo de arquivos tinha implementacao Storage -> URL -> Firestore, mas nao havia progresso visual, confirmacao de exclusao ou limpeza de arquivo orfao quando o Firestore falhasse.
- Firebase Storage do projeto `classvaulte` ainda nao esta inicializado. A CLI retornou que nao existe bucket padrao; e necessario abrir Firebase Console > Storage > Get Started.
- A aba IA fazia chamadas reais, mas a CSP nao liberava `https://api.openai.com` e `https://api.groq.com`.
- Providers de IA retornavam erros genericos, dificultando diagnostico de chave invalida, limite ou permissao.
- Erros de sincronizacao ficavam silenciosos demais para o usuario.
- O fluxo premium foi blindado anteriormente para usar Firestore como fonte da verdade em `userAccess/{uid}.paymentStatus`.

## Bugs Corrigidos

- Referencia antiga a Gemini 1.5 Flash foi removida.
- Gemini agora usa modelos 2.5 configuraveis: `gemini-2.5-flash` e `gemini-2.5-pro`.
- CSP passou a permitir OpenAI e Groq para chamadas reais do navegador.
- Trabalhos agora salvam `description` no Firestore e no estado local.
- Trabalhos agora salvam `dueDate`, `dueTime`, `createdAt`, `updatedAt` e mantem `dueAt` para compatibilidade.
- Trabalhos agora podem ser editados, incluindo titulo, descricao, prioridade e status.
- Trabalhos agora podem ser excluidos com confirmacao.
- Upload usa `uploadBytesResumable`, com progresso por arquivo.
- Se upload no Storage concluir mas escrita no Firestore falhar, o objeto enviado e removido para evitar arquivo orfao.
- Exclusao de arquivo confirma a acao e remove Storage + Firestore.
- IA agora tem endpoints permitidos na CSP para OpenAI, Groq e Gemini.
- Erros de IA agora exibem a mensagem retornada pela API quando disponivel.
- O app exibe erro global de sincronizacao quando Firestore/Storage falham.

## Melhorias de UX/UI

- Aba IA ganhou seletor de modelo Gemini com persistencia local.
- Aba IA exibe o modelo Gemini em uso.
- Aba IA permite anexar arquivo local temporario para resumo.
- Arquivos locais da IA nao sao enviados ao Firebase nem salvos no Firestore.
- Tarefas agora sao agrupadas por Atrasadas, Hoje, Proximas e Concluidas.
- Tarefas ganharam filtros por data/status.
- Campo multilinha de descricao em trabalhos.
- Cartoes de trabalhos exibem descricao longa com quebra de linha.
- Modal moderno para editar trabalhos.
- Empty states para trabalhos e arquivos.
- Barra de progresso em upload de arquivos.
- Mensagens de sucesso e erro no upload.
- Confirmacao antes de excluir arquivos e trabalhos.
- Estado de carregamento na geracao de IA.
- Mensagens amigaveis para falta de chave de API, erro de provider e estado premium.
- Indicador global de falha de sincronizacao.

## Arquivos Alterados

- `firebase.json`
- `index.html`
- `src/shared/store/vault-data.store.ts`
- `src/shared/layouts/AppShell.tsx`
- `src/modules/tasks/types/task.types.ts`
- `src/modules/tasks/components/TaskList.tsx`
- `src/modules/tasks/pages/TasksPage.tsx`
- `src/modules/classrooms/pages/ClassroomPage.tsx`
- `src/modules/files/components/FileDropzone.tsx`
- `src/modules/files/components/FileList.tsx`
- `src/modules/summaries/components/SummaryStudio.tsx`
- `src/modules/summaries/services/summary.service.ts`
- `src/modules/summaries/providers/openai.provider.ts`
- `src/modules/summaries/providers/gemini.provider.ts`
- `src/modules/summaries/providers/groq.provider.ts`
- `src/modules/summaries/store/summary.store.ts`
- `src/modules/summaries/types/summary.types.ts`
- `src/shared/components/ui/button.tsx`
- `src/shared/components/ui/card.tsx`
- `src/shared/components/ui/dialog.tsx`

## Fluxo Final de Documentos

### Documentos permanentes

1. Usuario autenticado seleciona arquivos na dropzone.
2. App valida tipo e limite de 20 MB.
3. Arquivo e enviado para Firebase Storage em `users/{uid}/files/{classroomId}/{id}-{nome}`.
4. Progresso e exibido por arquivo.
5. App obtem `downloadUrl` com `getDownloadURL`.
6. Metadados sao salvos em Firestore em `users/{uid}/files/{id}`.
7. Lista exibe arquivo, tamanho, categoria e botao de download.
8. Exclusao pede confirmacao e remove Storage + Firestore.

Observacao: o projeto precisa inicializar Firebase Storage no console para esse fluxo funcionar em producao.

### Documentos temporarios da IA

1. Usuario anexa arquivo local na aba IA.
2. O arquivo nao e enviado ao Firebase.
3. TXT e extraido localmente no navegador e anexado ao prompt.
4. PDF/DOCX sao aceitos no seletor, mas exigem parser dedicado para extracao automatica; enquanto isso, o app orienta o usuario a colar o texto.
5. O arquivo temporario e removido da memoria ao sair/limpar selecao.

## Fluxo Final da IA

1. Usuario premium (`paymentStatus === "active"`) informa texto.
2. Usuario salva chave local do provider no navegador.
3. Usuario escolhe provider e, no caso Gemini, modelo `gemini-2.5-flash` ou `gemini-2.5-pro`.
4. Modelo padrao: `gemini-2.5-flash`.
5. App chama provider escolhido: OpenAI, Gemini ou Groq.
6. CSP permite os endpoints necessarios.
7. Estado de carregamento e exibido.
8. Erros da API sao mostrados em linguagem clara.
9. Resultado e salvo em Firestore como resumo da conta do usuario.

## Fluxo Final das Tarefas

1. Usuario cria trabalho com titulo, descricao, data e hora opcional.
2. Firestore salva `title`, `description`, `dueDate`, `dueTime`, `dueAt`, `status`, `priority`, `ownerId`, `createdAt` e `updatedAt`.
3. Lista agrupa por atrasadas, hoje, proximas e concluidas.
4. Tarefa atrasada recebe indicador visual.
5. Tarefa de hoje recebe indicador visual.
6. Usuario pode editar ou excluir com confirmacao.

## Fluxo Final de Pagamentos

1. Usuario inicia como `beta`.
2. Ao clicar em "Ja paguei", app salva `paymentStatus: "pending"` em `userAccess/{uid}`.
3. Liberacao manual e feita no Firestore alterando `paymentStatus` para `"active"`.
4. Premium so libera quando `paymentStatus === "active"`.
5. Firestore segue como fonte principal; localStorage e apenas cache auxiliar.

## Recomendacoes Futuras

- Inicializar Firebase Storage e publicar `storage.rules`.
- Migrar chamadas de IA para um backend proprio quando houver escala, para proteger chaves e controlar rate limit.
- Criar notificacoes/toasts globais com fila e historico.
- Adicionar listeners realtime para `userAccess/{uid}` e dados principais quando o volume crescer.
- Implementar auditoria admin para alteracoes de pagamento.
- Adicionar testes automatizados para regras Firestore/Storage e fluxos premium.
- Considerar Firebase Hosting para aplicar headers HTTP reais de CSP/COOP.
