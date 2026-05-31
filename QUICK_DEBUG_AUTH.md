# Quick Debug: ReferenceError - supabase is not defined

## Solução Rápida

No console do DevTools (F12), use **isso** em vez de tentar acessar `supabase`:

### ✅ Opção 1: Verificar Sessão (Recomendado)

```javascript
// Verificar se há sessão salva no localStorage
const authData = JSON.parse(localStorage.getItem('classvault.supabase.auth') || '{}');
console.log('Sessão:', authData.session);
console.log('User ID:', authData.session?.user?.id);
console.log('Access Token:', authData.session?.access_token ? '✓ Exists' : '✗ Missing');
```

**Se retornar `null` ou `undefined`**: Você não está autenticado → Faça login novamente

**Se retornar um objeto**: Você está autenticado ✓

---

### ✅ Opção 2: Verificar localStorage completo

```javascript
// Ver TUDO que está salvo
console.log(localStorage);

// Ou só os dados de autenticação
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('supabase') || key.includes('auth')) {
    console.log(`${key}:`, localStorage.getItem(key));
  }
}
```

---

### ✅ Opção 3: Verificar Cookies

```javascript
// Ver todos os cookies
console.log('Cookies:', document.cookie);

// Procurar por auth-related cookies
const cookies = document.cookie.split(';');
cookies.forEach(cookie => {
  if (cookie.toLowerCase().includes('auth')) {
    console.log(cookie);
  }
});
```

---

## O que Significa Cada Resultado

| Resultado | Significado | Ação |
|-----------|-------------|------|
| `session: null` | Não autenticado | Faça login na app |
| `session: { ... }` | Autenticado ✓ | Verifique RLS do Supabase |
| `access_token` existente | Token válido ✓ | Tente criar uma matéria |
| `access_token` expirado | Precisa refazer login | Limpe localStorage e login |

---

## Se Still Não Funcionar

### 1. Limpe tudo e login novamente

```javascript
// Limpar storage
localStorage.clear();
sessionStorage.clear();

// Recarregar página
window.location.reload();

// Fazer login na UI
```

### 2. Verifique o user no Supabase

Vá para **Supabase Dashboard** > **Authentication** > **Users**

- O seu usuário aparece lá? ✓ ou ✗

### 3. Verifique a tabela profiles

No **SQL Editor** do Supabase:

```sql
SELECT * FROM public.profiles;
```

- Tem uma linha com seu user_id? ✓ ou ✗

---

## Próximo Passo

Depois de confirmar a autenticação, tente:

1. **Volte para a app**
2. **Clique em "Adicionar Matéria"**
3. **Preencha e salve**
4. **Abra DevTools** > **Console**
5. **Cole aqui a mensagem de erro** (se houver)

