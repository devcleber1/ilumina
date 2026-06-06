# TESTES

## Comandos disponíveis

- `yarn test`
  - Executa a suíte de testes Vitest do frontend.
- `yarn audit:pwa`
  - Executa a auditoria PWA via Lighthouse 10.
  - Gera o relatório em `lighthouse-pwa-v10.json`.

## O que está coberto

- Testes unitários e de integração com **Vitest** e **React Testing Library**.
- Validação de componentes, hooks, contexts, rotas e páginas.
- Verificação de manifesto PWA e ícones instaláveis.
- Verificação de registro de service worker e fallback offline.

## Requisitos

1. Instalar dependências:

```bash
yarn install
```

2. Iniciar o frontend localmente:

```bash
yarn dev --host 127.0.0.1 --port 5173
```

3. Em outro terminal, executar a auditoria PWA:

```bash
yarn audit:pwa
```

## Estrutura de testes

- `src/__tests__/` contém os arquivos de teste do frontend.
- A suíte atual valida componentes, fluxos de autenticação e funcionalidades principais.
- A auditoria PWA usa `manifest.json` e `sw.js` para garantir que o app seja instalável e funcione offline.

## Observações

- O `lighthouse` está fixado na versão `10.4.0` no `package.json` para garantir execução previsível.
- O relatório de auditoria PWA é escrito em `lighthouse-pwa-v10.json`.
- A auditoria usa o binário local do `lighthouse` do projeto para garantir que a versão fixada `10.4.0` seja usada.
- Na validação local, o score PWA foi `100%` (1.0) no relatório gerado.
- Para um resultado válido do PWA, o servidor deve estar acessível em `http://127.0.0.1:5173`.
- Para inspecionar o relatório local, abra `lighthouse-pwa-v10.json` ou use `cat lighthouse-pwa-v10.json | less`.
- A validação local confirma que o manifest, service worker e fallback offline funcionam com installability.
