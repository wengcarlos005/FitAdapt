# FitAdapt

App web de **treino personalizado** que adapta a ficha ao perfil do usuário (peso, altura, idade, nível e objetivo: perda de peso, ganho de massa ou condicionamento).

Site estático (HTML + CSS + JavaScript puro, sem build) — os dados ficam no `localStorage` do navegador.

## Funcionalidades

- **Onboarding**: objetivo, dados corporais, nível, dias/tempo disponíveis e equipamentos.
- **Algoritmo de ficha**: gera o split semanal (Full Body / PPL / Sup-Inf) com séries, repetições e descanso conforme o objetivo, filtrando pelos equipamentos disponíveis.
- **Troca de exercício**: substitui por uma alternativa do mesmo grupo muscular; a troca fica salva e é reversível.
- **Interface do exercício**: foto real do movimento (crossfade das 2 posições), demonstração, passo a passo, registro de carga por série e RPE, timer de descanso.
- **Sobrecarga progressiva**: sugere a carga do próximo treino a partir do histórico (dupla progressão) + deload a cada 4 semanas.
- **Ajuste de tempo**: encurta o treino conforme o tempo disponível no dia.
- **Progresso**: evolução de carga por exercício, volume por treino, consistência e conquistas (gamificação).

## Rodar localmente

Qualquer servidor estático serve. Ex.:

```bash
python -m http.server 8130
# abra http://localhost:8130
```

## Deploy no Vercel

É um site estático — não precisa de build.

1. Suba este repositório no GitHub.
2. No Vercel: **Add New → Project → Import** o repositório.
3. Framework Preset: **Other**. Build Command: *(vazio)*. Output Directory: *(vazio / raiz)*.
4. **Deploy**.

## Créditos

Fotos dos exercícios: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Domínio Público / Unlicense).
