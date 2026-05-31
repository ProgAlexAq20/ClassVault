# Debug: Dados Não Salvando no Supabase

## 1. VERIFICAÇÕES IMEDIATAS

### 1.1 Verificar se está autenticado
Abra o DevTools (F12) no navegador e execute no Console:

```javascript
// Verificar se há sessão ativa
const session = await supabase.auth.getSession();
console.log('Sessão:', session);

// Deve retornar um objeto com session.data.session não nulo
```

**Se sessão for NULL**: Problema é na autenticação → revise [GUIA_SUPABASE_GOOGLE_AUTH.md](GUIA_SUPABASE_GOOGLE_AUTH.md)

---

### 1.2 Verificar localStorage
```javascript
// Verificar se token está salvo
console.log(localStorage.getItem('classvault.supabase.auth'));

// Deve retornar um JSON com access_token e refresh_token
```

---

### 1.3 Verificar erro de RLS
No Console, tente inserir um registro manualmente:

```javascript
const { data, error } = await supabase
  .from('classrooms')
  .insert({
    id: crypto.randomUUID(),
    user_id: '12345', // seu user_id (veja na sessão acima)
    title: 'Teste',
    code: 'CV-TEST',
    color: '#8fce9e',
    icon: 'graduation-cap'
  })
  .select();

console.log('Error:', error);
console.log('Data:', data);
```

**Se erro contiver "policy"**: Problema é na RLS → veja seção 2

---

## 2. PROBLEMAS COMUNS E SOLUÇÕES

### ❌ Erro: "new row violates row-level security policy"

**Causas:**
- `user_id` não corresponde ao usuário autenticado
- Tabela não tem RLS ativado (paradoxalmente, sem RLS às vezes falha)
- Políticas de INSERT não permitem

**Solução:**

1. Verifique as políticas no Supabase:
   ```sql
   -- Execute no SQL Editor do Supabase
   SELECT schemaname, tablename, policyname, qual, with_check
   FROM pg_policies
   WHERE tablename = 'classrooms';
   ```

2. Se não houver políticas, ativar RLS e criar políticas:
   ```sql
   ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "classrooms_insert_own" ON public.classrooms
     FOR INSERT 
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "classrooms_select_own" ON public.classrooms
     FOR SELECT 
     USING (auth.uid() = user_id);
   ```

---

### ❌ Erro: "relation does not exist"

**Causa:** Tabela não foi criada

**Solução:** Execute o schema.sql completo:

1. Vá para **SQL Editor** no Supabase Dashboard
2. Crie uma nova query
3. Copie todo o conteúdo de `supabase/schema.sql`
4. Execute

---

### ❌ Erro: "Failed to create user profile"

**Causa:** Trigger `on_auth_user_created` falhou

**Solução:** 

1. Verifique se o trigger existe:
   ```sql
   SELECT trigger_name, trigger_body
   FROM pg_triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. Se não existe, crie:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS trigger
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, full_name, avatar_url)
     VALUES (
       NEW.id,
       LOWER(NEW.email),
       NEW.raw_user_meta_data->>'full_name',
       NEW.raw_user_meta_data->>'avatar_url'
     )
     ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
           avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
     RETURN NEW;
   END;
   $$;

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW 
     EXECUTE PROCEDURE public.handle_new_user();
   ```

---

### ❌ Erro: "Storage policy not configured"

**Causa:** Bucket de arquivos não tem políticas

**Solução:** Execute no SQL Editor:

```sql
DROP POLICY IF EXISTS "storage_select_own_classvault_files" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_own_classvault_files" ON storage.objects;

CREATE POLICY "storage_select_own_classvault_files" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'classvault-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_insert_own_classvault_files" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'classvault-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_update_own_classvault_files" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'classvault-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'classvault-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_delete_own_classvault_files" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'classvault-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

### ❌ Erro: "Invalid redirect URI"

**Causa:** URL de callback não bate

**Solução:**

1. No seu app, verifique qual URL está sendo usada:
   ```javascript
   import { getAppUrl } from '@/shared/services/supabase.client';
   console.log('Redirect URL:', getAppUrl() + '/#auth-callback');
   ```

2. Copie esse valor exato

3. Vá para Supabase > **Authentication** > **URL Configuration**

4. Adicione exatamente esse valor em **Redirect URLs**

---

## 3. VERIFICAR STATUS DO SUPABASE

### 3.1 Verificar if tables estão criadas

No SQL Editor do Supabase:

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deve retornar:
- classrooms ✓
- files ✓
- lessons ✓
- notes ✓
- profiles ✓
- summaries ✓
- tasks ✓
- events ✓

---

### 3.2 Verificar RLS status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_class
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE schemaname = 'public'
ORDER BY tablename;
```

A coluna `rowsecurity` deve ser `true` para todas as tabelas.

---

### 3.3 Verificar se triggers estão ativados

```sql
SELECT trigger_name, trigger_schema, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

Deve listar:
- `on_auth_user_created` (para tabela auth.users)
- `set_profiles_updated_at` (para profiles)
- `set_classrooms_updated_at` (para classrooms)
- `set_notes_updated_at` (para notes)

---

## 4. VERIFICAR LOGS DO APP

### 4.1 Ver erro no console
F12 → Console, procure por:
- `logAppError` messages
- Qualquer erro de network

---

### 4.2 Verificar syncError no estado

```javascript
import { useVaultDataStore } from '@/shared/store/vault-data.store';

const syncError = useVaultDataStore.getState().syncError;
console.log('Sync Error:', syncError);
```

---

## 5. TESTE COMPLETO

### 5.1 Limpar e refazer login

```javascript
// 1. Limpar storage
localStorage.clear();

// 2. Sair
await supabase.auth.signOut();

// 3. Recarregar página
window.location.reload();

// 4. Fazer login novamente
// 5. Tentar criar uma matéria
```

---

### 5.2 Teste de INSERT direto (sem UI)

```javascript
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

if (user) {
  const { data, error } = await supabase
    .from('classrooms')
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      title: 'Teste Debug',
      code: 'DBG-001',
      color: '#8fce9e',
      icon: 'graduation-cap'
    })
    .select();

  if (error) {
    console.error('ERRO:', error);
  } else {
    console.log('SUCESSO:', data);
    // Verifique no Supabase Dashboard > Database > classrooms
  }
}
```

---

## 6. CHECKLIST FINAL

- [ ] Usuário aparece em **Authentication** > **Users**
- [ ] Profile foi criado em `public.profiles`
- [ ] RLS está ativado em todas as tabelas
- [ ] Políticas de INSERT/SELECT existem
- [ ] Consegue inserir na tabela via SQL Editor (com `user_id` correto)
- [ ] Trigger `on_auth_user_created` existe
- [ ] Bucket `classvault-files` existe e tem políticas
- [ ] URL de redirect está correta
- [ ] `.env` tem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` válidos

---

## 7. CONTATO RÁPIDO

Se ainda não funcionar:

1. **Compartilhar screenshot do erro** (Console do browser)
2. **Confirmar**: Consegue acessar Supabase Dashboard?
3. **Confirmar**: Usuário aparece em **Authentication** > **Users**?
4. **Confirmar**: Que erro vê quando tenta criar uma matéria?

