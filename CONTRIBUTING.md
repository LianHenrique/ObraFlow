# Contribuindo

Obrigado por considerar contribuir com o ObraFlow!

## Ambiente local

- .NET SDK 8
- Node.js 20+
- npm

Siga as instruções do README para executar API e frontend.

## Fluxo sugerido

1. Crie uma branch a partir de `main`.
2. Faça alterações pequenas e objetivas.
3. Execute `dotnet build backend/ObraFlow.Api/ObraFlow.Api.csproj`.
4. Execute `npm run build` dentro de `frontend`.
5. Abra um Pull Request descrevendo a motivação e como validar a alteração.

## Padrões

- Mantenha nomes de domínio e mensagens voltados ao contexto de obras em português.
- Valide entradas na API; não confie apenas na validação do navegador.
- Não envie arquivos `.env`, bancos locais ou credenciais.
- Preserve compatibilidade com SQLite e ASP.NET Core 8.
