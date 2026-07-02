/* ==========================================================================
   FitAdapt — Conquistas / Medalhas (Passo 6 — gamificação)
   check(stats) recebe { treinos, streak, volumeTotal, semana } e retorna bool.
   ========================================================================== */

const ACHIEVEMENTS = [
  { id: 'primeiro',   nome: 'Primeiro passo',   desc: 'Conclua seu 1º treino',        icon: 'flame',    check: s => s.treinos >= 1 },
  { id: 'streak3',    nome: 'Pegando ritmo',    desc: '3 treinos seguidos',           icon: 'flame',    check: s => s.streak >= 3 },
  { id: 'streak7',    nome: 'Disciplina',       desc: '7 treinos seguidos',           icon: 'flame',    check: s => s.streak >= 7 },
  { id: 'streak30',   nome: 'Imparável',        desc: '30 treinos seguidos',          icon: 'flame',    check: s => s.streak >= 30 },
  { id: 'treinos10',  nome: 'Dez na conta',     desc: '10 treinos concluídos',        icon: 'check',    check: s => s.treinos >= 10 },
  { id: 'treinos50',  nome: 'Veterano',         desc: '50 treinos concluídos',        icon: 'check',    check: s => s.treinos >= 50 },
  { id: 'vol5k',      nome: 'Meia tonelada+',   desc: '5.000 kg de volume acumulado', icon: 'dumbbell', check: s => s.volumeTotal >= 5000 },
  { id: 'vol25k',     nome: 'Levantador',       desc: '25.000 kg acumulados',         icon: 'dumbbell', check: s => s.volumeTotal >= 25000 },
  { id: 'mes1',       nome: 'Um mês de foco',   desc: 'Alcance a 4ª semana',          icon: 'layers',   check: s => s.semana >= 4 },
];

function avaliarConquistas(state) {
  const stats = {
    treinos: (state.feedbacks || []).length,
    streak: state.streak || 0,
    volumeTotal: (state.feedbacks || []).reduce((a, f) => a + (f.volume || 0), 0),
    semana: (state.plan && state.plan.semana) || 1,
  };
  return ACHIEVEMENTS.map(a => ({ ...a, earned: a.check(stats) }));
}
