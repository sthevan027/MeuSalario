# Planejamento da atualização: compatibilidade salarial com custo de vida real

> Status: proposta funcional para implementação futura.
> Data-base desta documentação: 20/03/2026.

## 1. Objetivo da atualização

Criar uma nova experiência no MeuSalario para responder uma pergunta mais prática do usuário:

**"Esse salário realmente sustenta a vida que eu tenho ou a vida que eu quero ter?"**

Hoje o produto já calcula salário líquido e compara CLT x PJ. A nova atualização deve evoluir isso para uma análise de **compatibilidade entre proposta salarial, descontos reais, benefícios e custo de vida mensal**.

Exemplo de uso:
- o usuário recebe uma oferta de **R$ 6.000**;
- informa se a contratação será **CLT** ou **PJ**;
- o sistema calcula o valor líquido estimado;
- depois compara esse valor com os compromissos mensais informados pelo usuário;
- por fim, mostra se a proposta **fecha a conta**, **fica apertada** ou **não sustenta a rotina atual**.

---

## 2. Problema que a funcionalidade resolve

O usuário normalmente enxerga apenas o salário bruto da vaga, mas a decisão real depende de quatro camadas:

1. **regime de contratação**: CLT ou PJ;
2. **descontos automáticos**: INSS, IRRF, pró-labore, DAS, etc.;
3. **benefícios**: vale-refeição, vale-alimentação, vale-transporte, ajuda de custo, bônus recorrente;
4. **custo de vida pessoal**: aluguel, contas, transporte, saúde, alimentação, dívidas e reserva.

A atualização deve transformar o comparador em uma ferramenta de decisão de oferta, não apenas em uma calculadora tributária.

---

## 3. Objetivo de produto

### Resultado esperado
Permitir que o usuário:
- simule uma proposta salarial;
- descubra o líquido estimado;
- some benefícios mensais relevantes;
- informe despesas reais da vida dele;
- veja uma classificação objetiva do cenário.

### Pergunta principal da tela
**"Essa proposta cobre meus custos mensais e mantém minha saúde financeira?"**

### Perguntas derivadas
- Quanto sobra por mês depois das despesas?
- O benefício melhora a proposta de forma relevante?
- CLT com benefícios vale mais que PJ sem proteção?
- O vale-transporte reduz ou não o líquido final?
- O usuário precisaria cortar custos para aceitar a vaga?

---

## 4. Escopo da primeira versão (MVP desta atualização)

A primeira versão deve focar em uma simulação objetiva, com baixa complexidade de preenchimento e leitura fácil.

### Entradas principais
1. **Tipo de contrato**
   - CLT
   - PJ

2. **Valor da proposta**
   - salário bruto CLT; ou
   - valor mensal contratado PJ.

3. **Benefícios opcionais**
   - vale-refeição / vale-alimentação (ticket);
   - vale-transporte;
   - ajuda de custo mobilidade;
   - ajuda home office;
   - plano de saúde pago pela empresa;
   - bônus mensal recorrente;
   - outros benefícios em valor mensal estimado.

4. **Custos de vida mensais**
   - aluguel / financiamento;
   - condomínio;
   - energia;
   - água;
   - internet;
   - alimentação fora do ticket;
   - mercado;
   - transporte;
   - saúde / remédios;
   - educação;
   - dívidas / empréstimos;
   - dependentes / pensão;
   - lazer mínimo;
   - reserva financeira desejada.

### Saídas principais
- valor bruto;
- descontos estimados;
- líquido estimado;
- benefícios em dinheiro equivalente;
- custo de vida total;
- saldo mensal final;
- classificação de viabilidade.

### Classificações sugeridas
- **Confortável**: sobra relevante depois das despesas e da reserva;
- **Viável**: paga as contas, mas sobra pouco;
- **Apertado**: fecha o mês com margem muito baixa;
- **Inviável**: não cobre o custo mensal informado.

---

## 5. Relação com o sistema atual

O projeto já possui base para essa evolução:
- cálculo mensal CLT e PJ em `src/lib/calculators/monthly.ts`;
- comparação CLT x PJ em `src/lib/calculators/compare.ts`;
- tipos compartilhados em `src/lib/calculators/types.ts`;
- formulários existentes em `src/components/simulations/MonthlySimulationForm.tsx` e `src/components/simulations/CompareForm.tsx`.

### O que já existe e pode ser reaproveitado
- cálculo de INSS e IRRF para CLT;
- cálculo PJ com pró-labore + Simples Nacional;
- breakdown de ganhos e descontos;
- interface de simulação e exportação.

### O que falta
- modelagem de benefícios mensais;
- modelagem de custo de vida;
- cálculo de saldo pós-despesas;
- classificação de saúde financeira da proposta;
- comparação expandida entre regimes considerando benefícios.

---

## 6. Fluxo funcional proposto

### Etapa 1 — Dados da vaga
Campos:
- tipo de contrato: CLT ou PJ;
- remuneração bruta mensal;
- dependentes (para CLT);
- pró-labore e anexo do Simples, se PJ com cálculo real.

### Etapa 2 — Benefícios
Campos opcionais:
- recebe VR/VA?
- valor mensal do ticket;
- recebe vale-transporte?
- empresa desconta vale-transporte em folha?
- recebe auxílio mobilidade?
- recebe plano de saúde?
- recebe ajuda home office?
- recebe bônus mensal recorrente?
- recebe outros benefícios?

### Etapa 3 — Custos reais de vida
Campos mensais:
- moradia;
- contas fixas;
- transporte;
- alimentação;
- saúde;
- dívidas;
- educação;
- dependentes;
- lazer;
- reserva desejada.

### Etapa 4 — Resultado
O sistema exibe:
1. líquido estimado do contrato;
2. impacto mensal dos benefícios;
3. custo de vida total;
4. saldo após despesas;
5. diagnóstico textual.

Exemplo de diagnóstico:
- "Com essa proposta, você cobre seus custos essenciais, mas sua margem mensal fica baixa."
- "Com benefícios incluídos, a proposta CLT fica mais competitiva do que parece no bruto."
- "Sem considerar bônus variável, a proposta não cobre sua estrutura atual de gastos."

---

## 7. Regras de negócio da nova comparação

## 7.1 Fórmula-base da análise

### CLT
`salário bruto -> descontos legais -> líquido CLT -> somatório de benefícios relevantes -> renda disponível ampliada`

### PJ
`faturamento mensal -> descontos PJ -> líquido PJ -> benefícios pagos pela contratante (se existirem) -> renda disponível ampliada`

### Compatibilidade final
`renda disponível ampliada - custo de vida mensal total = saldo de compatibilidade`

---

## 7.2 Benefícios que entram no cálculo

Nem todo benefício deve ser tratado do mesmo jeito. A documentação funcional deve separar em 3 grupos:

### Grupo A — Benefícios que reduzem gasto do usuário
Entram com alto peso na análise:
- vale-refeição;
- vale-alimentação;
- vale-transporte;
- auxílio mobilidade;
- plano de saúde custeado pela empresa;
- auxílio creche;
- ajuda home office.

Esses benefícios não aumentam necessariamente o salário líquido em folha, mas **reduzem despesas que o usuário pagaria com o próprio bolso**.

### Grupo B — Benefícios financeiros diretos
Entram como valor mensal adicional:
- bônus fixo recorrente;
- ajuda de custo mensal recorrente;
- premiação mensal previsível.

### Grupo C — Benefícios informativos
Devem aparecer na comparação, mas não precisam entrar no total monetário do MVP:
- seguro de vida;
- gympass / wellhub;
- day off;
- stock options;
- participação nos lucros não recorrente;
- plano de carreira.

### Regra prática do MVP
Para simplificar a primeira versão:
- **benefícios monetizáveis** entram no cálculo;
- **benefícios não monetizáveis** aparecem apenas como contexto qualitativo.

---

## 7.3 Regra específica para ticket (VR/VA)

O usuário pediu que o ticket entre na análise principal.

### Decisão funcional
Adicionar um bloco opcional:
- recebe ticket? sim/não;
- tipo: VR, VA ou ambos;
- valor mensal total;
- há coparticipação/desconto em folha? sim/não;
- valor descontado do benefício, se houver.

### Fórmula sugerida
`benefício líquido de alimentação = valor total do ticket - desconto do trabalhador`

### Uso no resultado
Esse valor deve:
- aparecer no breakdown de benefícios;
- reduzir a despesa de alimentação do usuário; ou
- entrar como crédito de benefício na composição da renda disponível ampliada.

### Recomendação de UX
No MVP, usar apenas **valor mensal líquido do benefício**, sem tentar modelar regras internas complexas de PAT por empresa.

---

## 7.4 Regra específica para vale-transporte

Esta parte precisa ser clara porque impacta diretamente a experiência do CLT.

### Resumo legal para documentação funcional
Com base na **Lei nº 7.418/1985** e no regulamento consolidado no **Decreto nº 10.854/2021**:
- o vale-transporte não tem natureza salarial;
- não integra remuneração;
- não entra em base de INSS, FGTS ou IRRF;
- o empregado pode participar com parcela equivalente a **6% do salário básico**, excluídos adicionais e vantagens;
- o empregador paga o que exceder essa parcela;
- se o custo real do deslocamento for inferior a 6% do salário básico, o desconto pode ser apenas o valor efetivamente antecipado;
- convenção ou acordo coletivo podem prever condição mais favorável ao trabalhador.

### Implicação de produto
O sistema deve permitir três cenários:
1. **não recebe vale-transporte**;
2. **recebe vale-transporte com desconto legal padrão**;
3. **recebe vale-transporte com regra mais favorável por convenção/acordo**.

### Campos sugeridos
- recebe vale-transporte? sim/não;
- custo mensal total de deslocamento casa-trabalho;
- aplicar desconto padrão de até 6% do salário básico? sim/não;
- existe regra coletiva diferente? sim/não;
- percentual ou valor personalizado de desconto.

### Fórmula sugerida para o MVP
`desconto VT = menor entre (6% do salário básico) e (custo mensal de deslocamento)`

Se houver regra coletiva mais favorável:
`desconto VT = valor personalizado informado pelo usuário`

### Observação importante
A plataforma **não deve assumir automaticamente** que existe desconto de 5% por sindicato. Isso **não é uma regra geral federal do vale-transporte**. Quando houver percentual menor, a origem provável é convenção/acordo coletivo específico, e por isso o ideal é tratar essa hipótese como **regra personalizada informada pelo usuário**.

---

## 7.5 Regra sobre sindicato e descontos adicionais

Durante a pesquisa para esta documentação, o ponto de "5% do sindicato" apareceu como algo que pode gerar confusão.

### Diretriz para o produto
Separar completamente:
- **vale-transporte**; de
- **contribuições sindicais/assistenciais/negociais**.

### O que documentar para o usuário
- o vale-transporte segue a lógica legal do benefício de transporte;
- já descontos sindicais dependem de legislação, decisões judiciais e, muitas vezes, de acordo/convenção coletiva;
- percentuais como **5%** costumam aparecer em cláusulas de contribuição assistencial/negocial de categorias específicas, e **não devem ser tratados como regra padrão de vale-transporte**.

### Decisão para o MVP
Não embutir desconto sindical automático no cálculo.

Se necessário futuramente, criar um bloco avançado separado:
- possui desconto sindical/assistencial? sim/não;
- percentual ou valor;
- recorrência;
- observação de que depende da categoria e do direito de oposição quando aplicável.

---

## 8. Estrutura sugerida de cálculo

## 8.1 Novo conceito de resultado
Criar uma nova camada de saída além do líquido tradicional.

### Campos sugeridos
- `grossCompensation`
- `mandatoryDeductions`
- `netIncome`
- `benefitsGrossValue`
- `benefitsNetValue`
- `monthlyLifeCost`
- `essentialCost`
- `desiredReserve`
- `compatibilityBalance`
- `compatibilityStatus`
- `riskLevel`
- `insights[]`

## 8.2 Estrutura sugerida para benefícios

```ts
BenefitItem {
  id: string
  type: 'vr' | 'va' | 'vt' | 'mobilidade' | 'home_office' | 'plano_saude' | 'bonus' | 'outro'
  label: string
  monthlyValue: number
  employeeDiscount?: number
  netValue: number
  affectsExpenseCategory?: 'alimentacao' | 'transporte' | 'saude' | 'geral'
  includeInComparison: boolean
}
```

## 8.3 Estrutura sugerida para custo de vida

```ts
LifeCostInput {
  moradia: number
  contasFixas: number
  alimentacao: number
  transporte: number
  saude: number
  educacao: number
  dividas: number
  dependentes: number
  lazer: number
  reservaDesejada: number
  outros: number
}
```

---

## 9. Regras de UX e conteúdo

### Princípios
- linguagem simples;
- sem juridiquês excessivo;
- foco em decisão prática;
- mostrar claramente o que é salário, o que é benefício e o que é gasto.

### Mensagens importantes
- "Benefício não é o mesmo que salário líquido, mas reduz seu custo real de vida."
- "Vale-transporte pode gerar desconto em folha limitado pelas regras legais e/ou coletivas."
- "Alguns descontos dependem da sua categoria, empresa e convenção coletiva."

### Boa prática visual
Separar em 4 cards:
1. **O que entra**;
2. **O que sai**;
3. **Benefícios que aliviam custos**;
4. **Saldo real do mês**.

---

## 10. Critérios de aceitação da funcionalidade

### Critérios do MVP
- usuário consegue escolher CLT ou PJ;
- usuário consegue informar remuneração principal;
- sistema calcula líquido estimado com base no motor atual;
- usuário consegue informar custos mensais da vida real;
- usuário consegue informar ticket e vale-transporte;
- comparação final mostra saldo mensal;
- sistema classifica o cenário em faixas de viabilidade;
- sistema deixa claro quando existe valor estimado e quando existe valor personalizado.

### Critérios de confiança
- separar visualmente desconto legal de desconto personalizado;
- destacar que convenções coletivas podem alterar condições específicas;
- não aplicar descontos sindicais automáticos;
- não tratar benefício qualitativo como dinheiro automaticamente.

---

## 11. Casos especiais e limitações do MVP

### CLT
- convenções coletivas podem alterar desconto de VT ou conceder condições melhores;
- coparticipação em VR/VA varia por empresa;
- plano de saúde pode ter coparticipação e dependentes.

### PJ
- benefício pode não existir formalmente;
- ajuda de custo pode ser informal ou variável;
- comparação precisa evidenciar ausência de proteção trabalhista, mesmo quando o líquido for maior.

### Limitações assumidas
- não calcular regras complexas específicas de cada sindicato;
- não estimar PLR anual no MVP;
- não monetizar férias, 13º e FGTS dentro da primeira versão desta tela, a menos que a fase 2 aprove isso explicitamente.

> Observação de produto: em uma fase futura, pode valer criar um "modo comparação anual total" para refletir FGTS, 13º, férias e benefícios anuais da CLT contra PJ.

---

## 12. Proposta de implementação por fases

## Fase 1 — Planejamento e modelagem
- definir nome oficial da funcionalidade;
- fechar escopo do MVP;
- modelar inputs de benefícios e custo de vida;
- decidir se benefícios reduzem despesas ou somam renda disponível.

## Fase 2 — Motor de cálculo
- criar tipos novos para benefícios e custo de vida;
- criar função de compatibilidade salarial;
- integrar cálculo de VT e ticket;
- gerar status final da proposta.

## Fase 3 — Interface
- nova tela ou expansão do comparador atual;
- formulário em etapas;
- breakdown visual do resultado;
- insights textuais.

## Fase 4 — Persistência e histórico
- salvar custos de vida e benefícios por simulação;
- permitir reabrir proposta anterior;
- comparar múltiplas vagas.

## Fase 5 — Evoluções
- comparação anual CLT x PJ;
- simulação por cidade;
- benchmarking de custo ideal por faixa salarial;
- score de saúde financeira da proposta.

---

## 13. Recomendação técnica para o projeto

### Abordagem recomendada
Em vez de alterar o cálculo mensal atual de forma invasiva, criar uma nova camada composicional:

1. manter `simulateMonthly()` como base de líquido;
2. criar uma nova função, por exemplo `simulateSalaryFit()`;
3. compor:
   - resultado mensal atual;
   - benefícios;
   - custo de vida;
   - diagnóstico final.

### Vantagens
- preserva o comportamento já validado do motor atual;
- reduz risco de regressão;
- facilita testes unitários novos;
- permite usar a nova feature tanto em CLT quanto PJ.

---

## 14. Proposta de testes futuros

### Testes unitários
- CLT sem benefícios;
- CLT com ticket;
- CLT com VT e desconto padrão;
- CLT com VT e regra coletiva personalizada;
- PJ com benefícios monetários;
- cenário com saldo positivo;
- cenário com saldo zerado;
- cenário com saldo negativo.

### Testes de integração
- preenchimento completo do formulário;
- alternância CLT/PJ;
- persistência dos dados da proposta;
- renderização correta do diagnóstico final.

### Testes de UX/validação
- bloquear valores negativos inválidos;
- permitir campos opcionais vazios;
- explicar claramente estimativas;
- manter consistência entre preview e resultado salvo.

---

## 15. Perguntas em aberto para refinamento

Antes da implementação, vale fechar estas decisões:

1. O ticket deve **somar renda disponível** ou **abater a categoria alimentação**?
2. O plano de saúde entra com valor cheio ou só com economia estimada pelo usuário?
3. O comparador vai mostrar apenas análise mensal ou também anual?
4. O sistema vai considerar FGTS, 13º e férias como valor anual diluído na comparação CLT x PJ?
5. Vamos permitir múltiplas propostas lado a lado?
6. A funcionalidade será uma nova página ou uma evolução do comparador atual?

---

## 16. Decisão recomendada para a primeira entrega

Para entregar valor rápido com risco controlado:

### Recomendo implementar primeiro
- contrato CLT/PJ;
- líquido estimado usando motor atual;
- benefícios monetizáveis opcionais;
- custo de vida mensal;
- saldo final;
- diagnóstico simples;
- suporte explícito a ticket e vale-transporte.

### Recomendo deixar para depois
- regras sindicais específicas por categoria;
- monetização avançada de benefícios indiretos;
- comparação anual completa CLT x PJ;
- múltiplas propostas na mesma tela.

---

## 17. Referências legais e institucionais usadas nesta documentação

### Vale-transporte
- Lei nº 7.418/1985: institui o vale-transporte e estabelece que o empregador arca com a parcela que exceder 6% do salário básico. Link oficial: https://www.planalto.gov.br/ccivil_03/leis/l7418.htm
- Decreto nº 10.854/2021: consolida a regulamentação infralegal do vale-transporte, inclusive natureza não salarial, custeio, desconto e regras operacionais. Link oficial: https://www2.camara.leg.br/legin/fed/decret/2021/decreto-10854-10-novembro-2021-791950-normaatualizada-pe.html

### Contribuição sindical / assistencial
- Ministério do Trabalho e Emprego: a contribuição sindical depende de autorização prévia e expressa, conforme orientação institucional. Link oficial: https://www.gov.br/trabalho-e-emprego/pt-br/servicos/sindicatos/contribuicao-sindical
- STF/TST: contribuições assistenciais podem depender de norma coletiva e direito de oposição, o que reforça que isso não deve ser confundido com desconto-padrão de vale-transporte. Exemplo de referência pública indexada: https://jurisprudencia-backend2.tst.jus.br/rest/documentos/4702857ebf36604772815ccbb2485fa8

---

## 18. Resumo executivo

Esta atualização deve posicionar o MeuSalario como uma ferramenta de decisão de oferta de trabalho.

### Em uma frase
O usuário deixará de perguntar apenas **"quanto eu recebo líquido?"** e passará a responder **"essa vaga paga a vida que eu preciso sustentar?"**

### Direção recomendada
- reaproveitar o motor atual;
- criar nova camada de compatibilidade salarial;
- incluir ticket e vale-transporte como benefícios opcionais;
- permitir regra personalizada quando houver convenção mais favorável;
- não automatizar desconto sindical;
- focar no saldo real do mês.
