# Relatório de Segurança — Vault

## Resumo das Correções

| ID | Severidade | Descrição | Arquivo |
|----|-----------|-----------|---------|
| C1 | CRÍTICO | CORS permissivo com `origin: true` + `credentials: true` | `api/src/app.js` |
| C2 | CRÍTICO | Zod v4 não stripa campos extras por padrão → mass assignment | `api/src/**/*-validator.js` (6 arquivos) |
| C3 | CRÍTICO | Sem Content-Security-Policy — XSS sem restrições | `client/index.html` |
| H1 | ALTO | Timing attack no login permite enumeração de usuários | `api/src/modules/auth/auth-service.js` |
| H2 | ALTO | Rate limit genérico (100/15min) para login — brute-force possível | `api/src/modules/auth/auth-routes.js` |
| H3 | ALTO | JWT_SECRET não validado na inicialização | `api/src/config/env.js` |
| H4 | ALTO | Refresh token aceito via `req.body` — bypass do cookie httpOnly | `api/src/modules/auth/auth-controller.js` |
| H5 | ALTO | Rota admin escondida por condicional no `<Route>` — chunk baixável por qualquer um | `client/src/app.tsx`, `client/src/pages/admin-users.tsx` |
| H6 | ALTO | Erros crus expostos via `err: any` — vazamento de informação | `client/src/pages/recurring-expenses.tsx`, `client/src/pages/installment-expenses.tsx` |
| M1 | MÉDIO | `express.json()` sem `limit` — payload gigante pode crashar | `api/src/app.js` |
| M2 | MÉDIO | `updateBudget` sem checagem de NaN/Infinity | `api/src/modules/auth/auth-controller.js` |
| M3 | MÉDIO | `expiresAt` sem índice no Prisma — degradação com tokens expirados | `api/prisma/schema.prisma` |

---

## C1 — CORS permissivo

### Problema

Quando `CORS_ORIGIN=*` (default), o middleware CORS usava `origin: true`, que reflete qualquer `Origin` enviada pelo cliente. Combinado com `credentials: true`, qualquer site conseguia fazer requisições autenticadas entre origens.

### Código (antes)

```js
app.use(cors({
  origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(","),
  credentials: true,
}));
```

### Código (depois)

```js
app.use(cors({
  origin: env.corsOrigin.split(","),
  credentials: true,
}));
```

O default de `CORS_ORIGIN` foi alterado de `"*"` para `"http://localhost:5173"` em `env.js`.

### Por quê

`Access-Control-Allow-Origin: *` + `Access-Control-Allow-Credentials: true` viola a especificação CORS (browsers rejeitam). Ao listar origens específicas, o servidor só aceita requisições de origens conhecidas. O default aponta para o Vite dev server; em produção o administrador deve configurar o domínio real.

---

## C2 — Zod v4 não stripa campos extras (mass assignment)

### Problema

Zod v4 mudou o comportamento default: `.parse()` não remove campos não definidos no schema (ao contrário do Zod v3). Se um atacante enviar `{ "role": "ADMIN" }` no `PUT /api/auth/me`, o campo passaria pelo Zod e chegaria ao Prisma (que o ignoraria, mas ainda assim é um vetor latente).

### Código (antes)

```js
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  // ...
});
```

### Código (depois)

```js
function strip(schema) {
  return typeof schema.strip === "function" ? schema.strip() : schema;
}

export const updateProfileSchema = strip(z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  // ...
}));
```

### Por quê

`.strip()` instrui o Zod a remover qualquer campo não definido no schema antes de retornar o objeto. Como Zod v4 não faz isso automaticamente, explicitamos em todos os 6 arquivos de validação para garantir que apenas campos permitidos cheguem aos services/Prisma.

---

## C3 — Sem Content-Security-Policy (CSP)

### Problema

O `index.html` não tinha meta tag CSP. Qualquer vulnerabilidade XSS (mesmo via dependência) teria impacto total — inline scripts, `eval()`, conexões para origens arbitrárias seriam permitidas.

### Código (antes)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vault</title>
```

### Código (depois)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
           img-src 'self' data:; font-src 'self'; connect-src 'self' /api ...;
           frame-ancestors 'none'; form-action 'self'; base-uri 'self';">
<title>Vault</title>
```

### Por quê

CSP é uma camada de defesa contra XSS que restringe quais recursos o navegador pode carregar e executar. A política define que apenas scripts do próprio domínio são permitidos, estilos inline são aceitos (necessário para Tailwind), e conexões de rede são limitadas ao próprio domínio + API.

---

## H1 — Timing attack no login

### Problema

No login, o código verificava existência do usuário em um branch e a senha em outro. Um usuário inexistente retornava imediatamente (sem execução do `argon2.verify`), enquanto uma senha errada demorava mais (~100ms). Isso permitia enumeração de usuários via timing da resposta.

### Código (antes)

```js
const user = await prisma.user.findUnique({ where: { email: data.email } });
if (!user) {
  throw new Error("Invalid email or password"); // retorna rápido
}

const valid = await argon2.verify(user.password, data.password); // demora
if (!valid) {
  throw new Error("Invalid email or password");
}
```

### Código (depois)

```js
const user = await prisma.user.findUnique({ where: { email: data.email } });
const dummyHash = "$argon2id$v=19$m=65536,t=3,p=4$" + "A".repeat(22) + "$" + "A".repeat(43);
const valid = await argon2.verify(user?.password ?? dummyHash, data.password);
if (!user || !valid) {
  throw new Error("Invalid email or password");
}
```

### Por quê

Ao usar um hash dummy quando o usuário não existe, o `argon2.verify` sempre é executado, tornando o tempo de resposta aproximadamente constante independente de o email existir ou não. O atacante não consegue mais distinguir os dois casos por latência.

---

## H2 — Rate limit específico para login

### Problema

O rate limit global (100 req/15 min) se aplicava a todos os endpoints, incluindo `/api/auth/login`. Isso permitia ~6,6 tentativas de senha por minuto — insuficiente contra brute-force.

### Código (antes)

```js
router.post("/login", controller.login);
```

### Código (depois)

```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
});

router.post("/login", loginLimiter, controller.login);
```

### Por quê

Reduzir o limite para 10 tentativas a cada 15 minutos dificulta ataques de força bruta sem prejudicar usuários legítimos. A mensagem de erro é em português para manter a consistência com o resto da interface.

---

## H3 — JWT_SECRET não validado na inicialização

### Problema

Se `JWT_SECRET` estivesse ausente ou ainda fosse o valor default `"change-me-to-a-random-secret"`, o servidor iniciaria sem alerta. Tokens assinados com segredo fraco/conhecido poderiam ser forjados.

### Código (depois, adicionado em `env.js`)

```js
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}
```

### Por quê

Validar na inicialização previne que o servidor rode com uma configuração insegura. Um JWT_SECRET com menos de 32 caracteres é considerado fraco contra ataques de brute-force no token.

---

## H4 — Refresh token aceito via `req.body`

### Problema

O controller aceitava o refresh token tanto do cookie httpOnly quanto do corpo da requisição: `req.cookies?.refreshToken || req.body?.refreshToken`. Um script malicioso em uma origem comprometida poderia enviar o token via body, burlando a proteção httpOnly.

### Código (antes)

```js
const refreshTokenStr = req.cookies?.refreshToken || req.body?.refreshToken;
```

### Código (depois)

```js
const refreshTokenStr = req.cookies?.refreshToken;
```

### Por quê

Remover a fallback para `req.body` força o refresh token a vir exclusivamente do cookie httpOnly, que não é acessível via JavaScript. Isso elimina um vetor de ataque em caso de XSS ou comprometimento de origem permitida.

---

## H5 — Rota admin exposta no bundle do cliente

### Problema

A rota `/admin/usuarios` era condicionalmente registrada no React Router com `{user.role === "ADMIN" && (<Route .../>)}`. Embora o componente não renderizasse para não-admins, o chunk JavaScript era baixável por qualquer usuário logado, e a rota era registrada condicionalmente.

### Código (antes — `app.tsx`)

```tsx
{user.role === "ADMIN" && (
  <Route path="/admin/usuarios" element={<AdminUsersPage />} />
)}
```

### Código (depois — `app.tsx`)

```tsx
<Route path="/admin/usuarios" element={<AdminUsersPage />} />
```

### Código (depois — `admin-users.tsx`)

```tsx
export default function AdminUsersPage() {
  const { user } = useAuth();
  if (!user || user.role !== "ADMIN") return null;
  // ...
}
```

### Por quê

A validação de autorização deve sempre ocorrer no servidor (já existente via `authorize("ADMIN")`). Mas no cliente, a guarda dentro do próprio componente é mais segura que esconder o `<Route>`, pois impede que o código do componente seja executado mesmo se a rota for acessada por engano ou durante um race condition.

---

## H6 — Erros crus expostos na UI

### Problema

Dois componentes usavam `catch (err: any)` e passavam `err.message` diretamente para o estado de erro. Se a API retornasse mensagens técnicas (stack traces, caminhos internos), seriam exibidas ao usuário.

### Código (antes)

```tsx
catch (err: any) {
  setError(err.message || "Erro ao excluir");
}
```

### Código (depois)

```tsx
catch (err) {
  setError(err instanceof Error ? err.message : "Erro ao excluir");
}
```

### Por quê

`instanceof Error` garante que apenas mensagens de erro legítimas (aquelas lançadas intencionalmente pela aplicação) sejam exibidas. Qualquer outro tipo de exceção cai no fallback genérico, prevenindo vazamento de informação.

---

## M1 — `express.json()` sem limit

### Problema

`express.json()` usava o tamanho máximo default de 100kb sem limit explícito. Embora o default seja razoável, é uma boa prática definir explicitamente.

### Código (antes)

```js
app.use(express.json());
```

### Código (depois)

```js
app.use(express.json({ limit: "10kb" }));
```

### Por quê

Limitar o payload a 10kb previne ataques de exaustão de memória via JSON gigante. 10kb é mais que suficiente para qualquer payload legítimo da API.

---

## M2 — `updateBudget` sem checagem de NaN/Infinity

### Problema

A validação manual de `monthlyBudget` não checava `NaN` ou `Infinity`. Prisma rejeitaria esses valores com erro 500 em vez de 400.

### Código (antes)

```js
if (typeof monthlyBudget !== "number" || monthlyBudget < 0) {
```

### Código (depois)

```js
if (typeof monthlyBudget !== "number" || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
```

### Por quê

`Number.isFinite` rejeita `NaN`, `Infinity` e `-Infinity`, garantindo que apenas números válidos passem pela validação.

---

## M3 — Índices em `expiresAt` no Prisma

### Problema

Os campos `RefreshToken.expiresAt` e `RevokedToken.expiresAt` não tinham índice. O job de limpeza de tokens expirados (executado a cada hora) precisava fazer scan sequencial na tabela.

### Código (antes)

```prisma
@@map("refresh_tokens")
}

@@map("revoked_tokens")
}
```

### Código (depois)

```prisma
@@index([expiresAt])
@@map("refresh_tokens")
}

@@index([expiresAt])
@@index([jti])
@@map("revoked_tokens")
}
```

### Por quê

Índices em `expiresAt` aceleram o job de limpeza e queries de busca por tokens expirados. O índice adicional em `RevokedToken.jti` acelera a verificação de revogação na autenticação (função `isTokenRevoked`).
