# General View

> “Como Project Manager, quero que a equipa configure uma SPA moderna, modular e que consuma APIs REST de forma consistente e escalável.”

Traduzindo:

* Precisamos de uma **base técnica sólida** (React, estrutura, rotas, layout, HTTP client).
* O sistema deve crescer sem ficar caótico.
* Deve falar com o **back-end** (.NET) via **APIs REST**.

---

# ESTRUTURA GERAL DO PROJETO

```
client-ui/
└─ src/
   ├─ app/               → lógica global (router, store, tipos)
   ├─ components/        → peças visuais reutilizáveis
   ├─ features/          → cada módulo funcional (ex: VVN)
   ├─ hooks/             → “mini controladores” que gerem comportamento (ex: guards)
   ├─ pages/             → páginas genéricas (Home, Login, NotFound)
   ├─ services/          → comunicação com API (Axios, Auth)
   ├─ styles/            → CSS global
   ├─ App.jsx            → ponto central da aplicação
   └─ main.jsx           → arranque do React
```

Cada parte tem uma **responsabilidade específica**, para manter o projeto limpo e modular.

---

## `src/app/router.jsx` — O **cérebro da navegação**

### Função:

Define as **rotas** (os caminhos que o utilizador pode visitar) e **o que aparece em cada uma**.

### 📘 Código:

```jsx
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import { RequireAuth, RequireRole } from "../hooks/useAuthGuard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,     // layout comum (header + footer)
    children: [
      { index: true, element: <Home /> }, // Home page ("/")
      {
        element: <RequireAuth />, // protege as rotas abaixo
        children: [
          {
            path: "admin",
            element: <RequireRole roles={["Admin", "Manager"]} />,
            children: [
              { index: true, element: <div>Admin Dashboard</div> },
            ],
          },
          { path: "forbidden", element: <div>Acesso negado</div> },
        ],
      },
      { path: "*", element: <NotFound /> }, // qualquer rota inexistente
    ],
  },
  { path: "/login", element: <Login /> },
]);
```

###  O que acontece:

* `createBrowserRouter` cria o “mapa” de rotas.
* `/` mostra o **layout base** com `Header`, `Nav` e `Footer`.
* Dentro dele:

    * `/` → `Home`
    * `/login` → `Login`
    * `/admin` → só abre se `RequireAuth` e `RequireRole` deixarem.
    * `/forbidden` → mostra mensagem de acesso negado.
    * `*` → apanha todas as rotas inexistentes → `NotFound`.

---

## `src/components/layout/AppLayout.jsx` e `Nav.jsx` — **A estrutura visual**

### Função:

Mostra o “esqueleto” comum a todas as páginas (cabeçalho, navegação, rodapé).

### 📘 `AppLayout.jsx`:

```jsx
import { Outlet } from "react-router-dom";
import Nav from "./Nav";

export default function AppLayout() {
  return (
    <div className="app">
      <header className="header">
        <h1>Port Management</h1>
        <Nav />
      </header>

      <main className="content">
        <Outlet /> {/* o conteúdo da rota atual */}
      </main>

      <footer className="footer">© 2025 ISEP — SEM5-PI</footer>
    </div>
  );
}
```

 O `<Outlet />` é o local onde o **React Router** insere a página ativa (ex.: Home, Login, etc.).

---

### `Nav.jsx`

```jsx
import { Link } from "react-router-dom";
import { useAppStore } from "../../app/store";

export default function Nav() {
  const user = useAppStore((s) => s.user);

  return (
    <nav className="nav">
      <Link to="/">Início</Link>

      {user && (
        <>
          <Link to="/vvn">VVNs</Link>
          <Link to="/vvn/new">Nova VVN</Link>
        </>
      )}

      {!user ? <Link to="/login">Login</Link> : <Link to="/logout">Sair</Link>}
    </nav>
  );
}
```

Aqui a navegação **adapta-se ao estado do utilizador**:

* Se `user` for `null` → mostra “Login”.
* Se `user` estiver autenticado → mostra links adicionais (ex.: VVNs).

---

## `src/app/store.js` — **Mini estado global (Zustand)**

### Função:

Guardar o **utilizador autenticado** e o **estado de loading**, acessível em toda a app.

### Código:

```js
import { create } from "zustand";

export const useAppStore = create((set) => ({
  user: null,
  loading: false,
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
}));
```

Isto é uma alternativa **leve ao Redux** — super simples e direto.
Usas em qualquer componente com `useAppStore((s) => s.user)`.

---

## `src/hooks/useAuthGuard.jsx` — **Proteção de rotas**

### Função:

Bloquear páginas a quem não tiver login ou role adequada.

### Código:

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../app/store";

export function RequireAuth() {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole({ roles }) {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  const has = user.roles?.some((r) => roles.includes(r));
  if (!has) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
```

 `RequireAuth` → só entra se `user` existir.
 `RequireRole` → além disso, verifica se o `user` tem um dos `roles` exigidos.

---

## `src/services/api.js` — **Cliente HTTP (Axios)**

### Função:

Faz todas as chamadas à API do back-end (.NET).
Centraliza a `baseURL`, token, tratamento de erros, etc.

### Código:

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // lido do .env
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Exemplo: redirecionar para login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

Assim, qualquer serviço que precise de chamar a API pode usar:

```js
import api from "@/services/api";

const { data } = await api.get("/api/VesselVisitNotification");
```

Não precisas repetir `baseURL`, `headers` ou tratamento de erros em cada chamada.

---

## `src/services/auth.js` — **Gestão de autenticação (stub)**

### Função:

Simular login, logout e carregamento de perfil (`/me/role`).

### Código:

```js
import api from "./api";
import { useAppStore } from "../app/store";

export async function fetchMe() {
  const { data } = await api.get("/api/me/role");
  useAppStore.getState().setUser(data);
}

export function loginDev() {
  localStorage.setItem("access_token", "dev-token");
  return fetchMe();
}

export function logout() {
  localStorage.removeItem("access_token");
  useAppStore.getState().setUser(null);
}
```

Por agora é *simulado*, mas depois liga-se ao IAM real (OpenID Connect/OAuth2).

---

##`src/pages/Home.jsx`, `Login.jsx`, `NotFound.jsx`

### Função:

Páginas simples para testar o fluxo base.

### `Home.jsx`

```jsx
export default function Home() {
  return <h2>Bem-vindo 👋</h2>;
}
```

### `Login.jsx`

```jsx
import { loginDev } from "../services/auth";

export default function Login() {
  async function handleLogin() {
    await loginDev(); // simula login
    window.location.href = "/";
  }
  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin}>Entrar (Dev)</button>
    </div>
  );
}
```

### `NotFound.jsx`

```jsx
export default function NotFound() {
  return <h2>404 — Página não encontrada</h2>;
}
```

---

## `.env` — **Configuração por ambiente**

```env
VITE_API_BASE_URL=http://localhost:5008
```

Define onde estão as tuas APIs REST (.NET).
O Axios lê este valor automaticamente com `import.meta.env`.

---

## `App.jsx` e `main.jsx` — **Arranque da aplicação**

### `App.jsx`

```jsx
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import "./styles/globals.css";

export default function App() {
  return <RouterProvider router={router} />;
}
```

Envolve tudo e fornece o router à aplicação.

---

### `main.jsx`

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Este é o verdadeiro “ponto de entrada” — é aqui que o React é montado no HTML.

---

# EM RESUMO

| Área          | Ficheiro                          | Propósito                                             |
| ------------- | --------------------------------- | ----------------------------------------------------- |
| Navegação     | `app/router.jsx`                  | Define todas as rotas e quais são públicas/protegidas |
| Layout        | `components/layout/AppLayout.jsx` | Estrutura visual comum                                |
| Estado global | `app/store.js`                    | Guarda utilizador e loading                           |
| Segurança     | `hooks/useAuthGuard.jsx`          | Bloqueia rotas não autorizadas                        |
| API           | `services/api.js`                 | Cliente HTTP centralizado com Axios                   |
| Autenticação  | `services/auth.js`                | Simulação de login/logout                             |
| Páginas base  | `pages/*`                         | Home, Login e 404                                     |
| Configuração  | `.env`                            | URL da API (facilita deploy em VM/produção)           |
| Arranque      | `App.jsx`, `main.jsx`             | Entrada da aplicação React                            |

---

**Em resumo prático:**

* Montámos a base de uma SPA moderna e escalável.
* Preparámos tudo para facilmente adicionar módulos (ex.: `VVN`, `Docks`, etc.).
* A autenticação e as chamadas API estão estruturadas.
* O layout e router já permitem navegação entre papéis (roles).
* Tudo está organizado por *responsabilidade*.
