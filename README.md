# 🌟 ONG Ilumina — Portal Frontend

> Interface de usuário moderna, responsiva e em tempo real para a gestão educacional e social da ONG Iluminando o Futuro. Desenvolvida com as tecnologias de ponta do ecossistema React.

---

## 🛠️ Stack Tecnológica

O portal é construído seguindo os padrões mais exigentes de performance, tipagem e estilo:

- **Core:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) (Build super-rápida com HMR ativo)
- **Linguagem:** [TypeScript 6](https://www.typescriptlang.org/) (Strict Mode de tipagem rígida, sem `any`)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) (Design Utilitário moderno e responsivo)
- **Roteamento:** [React Router Dom v7](https://reactrouter.com/) (Gestão de rotas e níveis de acesso)
- **Ícones & Componentes:** [Lucide React](https://lucide.dev/) + [Shadcn/UI](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/)
- **Testes:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (55 testes unitários e de integração ativos)

---

## 📂 Arquitetura do Projeto

A estrutura de arquivos foi projetada visando o Single Responsibility Principle (SRP) e alta escalabilidade:

```text
ilumina/
├── src/
│   ├── __tests__/          # Suíte completa de testes unitários e integração
│   ├── Components/         # Componentes globais compartilhados (Sidebar, Modais, Inputs)
│   ├── contexts/           # Provedores de Estado Global (Autenticação, Alertas)
│   ├── hooks/              # Hooks customizados para lógica reutilizável
│   ├── lib/                # Serviços e utilitários de terceiros (Axios, Socket.IO, Storage)
│   ├── Pages/              # Páginas da aplicação organizadas por níveis de acesso
│   │   ├── Admin/          # Telas do Administrador e Super-Administrador
│   │   ├── Parent/         # Portal do Responsável (Pais e Familiares)
│   │   ├── Teacher/        # Portal do Professor
│   │   └── Auth/           # Tela de Login e autenticação inicial
│   ├── routes/             # Definição e proteção de rotas da aplicação
│   ├── utils/              # Funções auxiliares e formatadores puros
│   ├── App.tsx             # Componente raiz da aplicação
│   └── main.tsx            # Ponto de entrada do React
├── .env.example            # Exemplo de configuração de variáveis de ambiente
├── .gitignore              # Proteção contra vazamento de credenciais e prompts
└── tsconfig.json           # Configuração estrita do compilador TypeScript
```

---

## ⚡ Guia de Execução Local

### Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) e o [Yarn](https://yarnpkg.com/) instalados em sua máquina.

### 1. Clonar e Instalar Dependências

```bash
# Navegar até a pasta do Frontend
cd Front-End-Ilumina/ilumina

# Instalar pacotes
yarn install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e ajuste as URLs da API do backend caso necessário:

```bash
cp .env.example .env
```

O conteúdo padrão do `.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Executar o Servidor de Desenvolvimento

```bash
yarn dev
```

### 4. Rodar a Suíte Completa de Testes

Para executar a suíte com os 55 testes validados:

```bash
npx yarn test --run
```

---

## 🔌 Integrações Importantes

### Cloudinary (Exibição de Imagens)

O frontend espera que os recursos de mídia (fotos de perfil e documentos) sejam retornados pelo backend como URLs acessíveis. Atualmente o backend pode retornar URLs absolutas do Cloudinary (ex: `https://res.cloudinary.com/...`) ou caminhos locais (`/uploads/...`).

Recomendações para o frontend:

- Use a variável de ambiente `VITE_API_URL` para construir URLs locais quando o backend retornar caminhos relativos.
- Se a URL começar com `http` (Cloudinary) use-a diretamente.
- Garanta que a política CSP no `index.html` permita `https://res.cloudinary.com` (já configurado no repositório).

### WebSocket / Socket.IO

O frontend usa `socket.io-client` para receber eventos em tempo real do backend. A URL base do socket é derivada de `VITE_API_URL` removendo possivelmente o sufixo `/api`.

Arquivo cliente: `src/lib/socket.ts`

Variável de ambiente necessária:

```env
VITE_API_URL=http://localhost:3001
```

Para testar localmente:

- Inicie o backend (`npm run dev` no backend) que expõe o Socket.IO via `initSocket()`.
- Inicie o frontend (`yarn dev`) e abra o console do navegador para verificar logs de conexão do socket.

## 🧭 Níveis de Acesso e Rotas do Sistema

O portal possui controle estrito de acessos baseado no tipo de usuário logado (`tipo` e `nivel_acesso`):

| Rota                      | Acesso                 | Descrição                                                     |
| :------------------------ | :--------------------- | :------------------------------------------------------------ |
| `/`                       | Público                | Tela de autenticação unificada                                |
| `/dashboard`              | `admin` / `superadmin` | Painel de controle geral e estatísticas em tempo real         |
| `/dashboard/usuarios`     | `superadmin`           | Listagem, busca e exclusão de usuários ativos                 |
| `/dashboard/cadastro-*`   | `admin` / `superadmin` | Telas de cadastro de Alunos, Professores, Pais e Oficinas     |
| `/dashboard/presenca`     | `admin` / `superadmin` | Controle de faltas, justificativas e chamada em lote          |
| `/dashboard/advertencias` | `admin` / `superadmin` | Emissão de ocorrências disciplinares em tempo real            |
| `/professor/portal`       | `professor`            | Painel do docente com chamada e histórico de aulas            |
| `/responsavel/portal`     | `pai`                  | Painel da família com monitoramento de faltas, notas e avisos |

---

## 🎨 Galeria Visual e Mockups do Sistema

> [!NOTE]
> Esta seção foi projetada para receber capturas de tela e mockups de alta fidelidade de cada módulo da aplicação para auxiliar novos desenvolvedores e demonstrar o design premium do Ilumina.

### 🔐 1. Fluxo de Autenticação & Telas Gerais

```carousel
![Tela de Login](/src/assets/mockups/login.png)
<!-- slide -->
![Redefinição de Senha](/src/assets/mockups/reset_password.png)
```

- **Tela de Login (`Auth.tsx`):** Formulário moderno com feedback visual de validação de campos (Yup), alternância de visibilidade de senha e proteção contra erros do servidor.
- **Reset de Senha (`ResetPassword.tsx`):** Interface administrativa para geração rápida de nova senha padrão e recuperação de acesso.

---

### 👑 2. Módulo do Administrador e Super-Administrador

```carousel
![Dashboard Geral](/src/assets/mockups/admin_dashboard.png)
<!-- slide -->
![Registro de Chamada](/src/assets/mockups/admin_presenca.png)
<!-- slide -->
![Gestão de Ocorrências](/src/assets/mockups/admin_advertencias.png)
<!-- slide -->
![Formulários de Cadastro](/src/assets/mockups/admin_cadastros.png)
```

- **Visão Geral (Dashboard):** Cards de métricas dinâmicas de alunos e oficinas com gráficos interativos e feeds em tempo real das atividades recentes.
- **Controle de Presença (`Presenca.tsx`):** Chamada de alunos simplificada com filtros de busca rápida e travamento de segurança após 2 alterações no mesmo dia.
- **Gestão de Advertências (`Advertencia.tsx`):** Registro imediato de ocorrências disciplinares que se conectam via Socket.IO para alertar os responsáveis instantaneamente.
- **Gerenciar Usuários (`EditUsers.tsx`):** Controle central de perfis de alunos, pais, professores e administradores da ONG.

---

### 👨‍🏫 3. Módulo do Professor

```carousel
![Painel do Professor](/src/assets/mockups/teacher_dashboard.png)
<!-- slide -->
![Chamada por Oficina](/src/assets/mockups/teacher_rollcall.png)
```

- **Portal do Docente (`PortalTeacher.tsx`):** Visão centralizada das turmas e oficinas ativas designadas ao professor logado.
- **Chamada Rápida:** Atalho direto para realizar chamada diária nas oficinas, salvamento automático e integração instantânea com os dados da secretaria da ONG.

---

### 👪 4. Módulo do Responsável (Pais e Familiares)

```carousel
![Portal do Responsável](/src/assets/mockups/parent_portal.png)
<!-- slide -->
![Notificações de Ocorrências](/src/assets/mockups/parent_alerts.png)
```

- **Visão da Família (`Portal.tsx`):** Acompanhamento detalhado da vida escolar e social dos filhos vinculados (percentual de frequência e advertências).
- **Alertas em Tempo Real:** Sistema de notificações via Socket.IO que exibe pop-ups instantâneos para os pais a cada atualização de presença ou ocorrência dos alunos.

---

## 🧪 Suíte de Testes e Qualidade de Código

O projeto conta com testes unitários e de integração robustos implementados com **Vitest** e **React Testing Library**. Para rodar a verificação de sanidade do sistema:

```bash
# Rodar todos os testes (34 arquivos com 55 testes verdes)
npx yarn test --run
```

Nossas regras garantem que:

1.  **Strict Mode:** TypeScript configurado sem permissão para o tipo `any` ou variáveis não utilizadas.
2.  **Modularidade:** Funções sempre contidas abaixo de 40 linhas e com profundidade de identação máxima de 2 níveis.
3.  **Segurança:** Variáveis sensíveis e segredos nunca são incluídos em arquivos públicos, utilizando sempre variáveis de ambiente configuradas no `.env`.
