/* ==========================================================================
   FitAdapt — Catálogo de equipamentos
   Usado no onboarding (o que a academia tem) e no algoritmo (Passo 3) para
   filtrar exercícios que o usuário consegue de fato executar.
   "Peso corporal" é sempre incluído como base universal.
   ========================================================================== */

const EQUIPMENT = [
  { id: 'peso_corporal', nome: 'Peso corporal', ico: '🧍', base: true },
  { id: 'halteres',      nome: 'Halteres',      ico: '🏋️' },
  { id: 'barra',         nome: 'Barra / anilhas', ico: '➖' },
  { id: 'maquinas',      nome: 'Máquinas',      ico: '⚙️' },
  { id: 'polia',         nome: 'Polia / cabo',  ico: '🪝' },
  { id: 'kettlebell',    nome: 'Kettlebell',    ico: '🔔' },
  { id: 'elastico',      nome: 'Elásticos',     ico: '➰' },
  { id: 'banco',         nome: 'Banco',         ico: '🛋️' },
  { id: 'barra_fixa',    nome: 'Barra fixa',    ico: '🚧' },
  { id: 'cardio',        nome: 'Esteira / bike', ico: '🚴' },
];
