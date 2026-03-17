# Política de Versionamento (SemVer)

Este documento define o padrão de versionamento do **MeuSalário** usando o modelo **SemVer**:

`MAJOR.MINOR.PATCH` (ex.: `1.4.2`)

## 1) MAJOR
Exemplo: `1.0.0 -> 2.0.0`

Use quando houver **quebra de compatibilidade** ou mudanças estruturais grandes.

Critérios práticos:
- endpoints antigos deixam de funcionar;
- fluxos principais mudam de forma incompatível;
- refatoração estrutural com impacto de contrato.

Regra: se algo antigo para de funcionar, incrementa **MAJOR**.

## 2) MINOR
Exemplo: `1.1.0 -> 1.2.0`

Use quando entrar **funcionalidade nova sem quebrar o que já existe**.

Critérios práticos:
- novo módulo/tela;
- nova feature no app;
- expansão de capacidades mantendo compatibilidade.

Regra: adicionou algo novo sem quebrar, incrementa **MINOR**.

## 3) PATCH
Exemplo: `1.0.1 -> 1.0.2`

Use para **correções e ajustes incrementais**.

Critérios práticos:
- bug fix;
- melhoria interna sem mudança de contrato;
- ajuste de UX/performance sem breaking change.

Regra: só corrigiu/ajustou, incrementa **PATCH**.

## Marco de produção
Como o sistema já está em produção, o baseline público é:

- `v1.0.0` -> primeira versão estável em produção.

A partir disso:
- `v1.x.0` para features compatíveis;
- `v1.0.x` ou `v1.y.x` para correções.

## Pré-lançamentos (quando necessário)
Para ciclos de validação:
- `v1.2.0-beta`
- `v1.0.0-alpha`
- `v2.0.0-rc1`

## Linha aplicada nas release notes do site
As notas exibidas em `/atualizacoes` e `/app/atualizacoes` seguem esta convenção:
- **Feature/Melhoria**: incremento de **MINOR**;
- **Correção**: incremento de **PATCH**.

Versões atuais publicadas no site:
- `v1.2.1` (Correção)
- `v1.2.0` (Melhoria)
- `v1.1.0` (Feature)
