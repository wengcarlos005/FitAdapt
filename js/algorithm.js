/* ==========================================================================
   FitAdapt — Algoritmo de personalização (Passo 3)
   Gera a ficha semanal a partir do perfil e encontra substituições.
   ========================================================================== */

const Algo = (() => {

  /* Parâmetros de treino por objetivo */
  const OBJ_PARAMS = {
    perda_peso:      { series:3, reps:'12-15', descanso:45, cardioFinal:true  },
    ganho_massa:     { series:4, reps:'8-12',  descanso:75, cardioFinal:false },
    condicionamento: { series:3, reps:'10-15', descanso:60, cardioFinal:true  },
  };

  /* Nível máximo de dificuldade permitido */
  function nivelMax(nivel) {
    return nivel === 'iniciante' ? 2 : 3;
  }

  /* Templates de dia: lista de grupos musculares a cobrir (na ordem) */
  const TEMPLATES = {
    fullbodyA: { foco:'Full Body A', grupos:['peito','costas','quadriceps','ombro','core'] },
    fullbodyB: { foco:'Full Body B', grupos:['costas','posterior','ombro','triceps','core'] },
    fullbodyC: { foco:'Full Body C', grupos:['peito','quadriceps','biceps','gluteos','core'] },
    push:      { foco:'Empurrar (Push)', grupos:['peito','ombro','peito','triceps'] },
    pull:      { foco:'Puxar (Pull)',    grupos:['costas','costas','biceps','biceps'] },
    legs:      { foco:'Pernas (Legs)',   grupos:['quadriceps','posterior','gluteos','adutores','panturrilha'] },
    upperA:    { foco:'Superiores A', grupos:['peito','costas','ombro','biceps','triceps'] },
    lowerA:    { foco:'Inferiores A', grupos:['quadriceps','posterior','gluteos','panturrilha'] },
    upperB:    { foco:'Superiores B', grupos:['costas','peito','ombro','triceps','biceps'] },
    lowerB:    { foco:'Inferiores B', grupos:['posterior','quadriceps','adutores','gluteos','panturrilha'] },
  };

  /* Split conforme dias/semana e nível */
  function montarSplit(dias, nivel) {
    switch (dias) {
      case 2: return ['fullbodyA','fullbodyB'];
      case 3: return nivel === 'iniciante'
        ? ['fullbodyA','fullbodyB','fullbodyC']
        : ['push','pull','legs'];
      case 4: return ['upperA','lowerA','upperB','lowerB'];
      case 5: return ['push','pull','legs','upperA','lowerA'];
      case 6: return ['push','pull','legs','push','pull','legs'];
      default: return ['fullbodyA','fullbodyB','fullbodyC'];
    }
  }

  /* Um exercício é executável se o usuário tem TODOS os equipamentos dele */
  function disponivel(ex, equipamentos) {
    return ex.equip.every(e => equipamentos.includes(e));
  }

  /* Candidatos para um grupo muscular */
  function candidatos(grupo, profile, usados) {
    const max = nivelMax(profile.nivel);
    return EXERCISES
      .filter(ex => ex.grupo === grupo)
      .filter(ex => disponivel(ex, profile.equipamentos))
      .filter(ex => ex.nivel <= max)
      .sort((a, b) => {
        // 1) ainda não usados vêm primeiro (variedade)
        const ua = usados.has(a.id) ? 1 : 0;
        const ub = usados.has(b.id) ? 1 : 0;
        if (ua !== ub) return ua - ub;
        // 2) compostos antes de isolados
        const ca = a.tipo === 'composto' ? 0 : 1;
        const cb = b.tipo === 'composto' ? 0 : 1;
        return ca - cb;
      });
  }

  /* Gera a ficha semanal completa */
  function generate(profile) {
    const params = OBJ_PARAMS[profile.objetivo] || OBJ_PARAMS.condicionamento;
    const split = montarSplit(profile.dias, profile.nivel);
    const usados = new Set();

    const dias = split.map((key, i) => {
      const tpl = TEMPLATES[key];
      const exercicios = [];

      tpl.grupos.forEach(grupo => {
        const cand = candidatos(grupo, profile, usados);
        if (!cand.length) return; // sem equipamento p/ esse grupo → pula
        const ex = cand[0];
        usados.add(ex.id);

        const isCore = grupo === 'core';
        exercicios.push({
          exId: ex.id,
          series: isCore ? 3 : params.series,
          reps: ex.repsFixo || params.reps,
          descanso: isCore ? 45 : params.descanso,
          carga: null, // sugestão de carga entra no Passo 6 (sobrecarga progressiva)
        });
      });

      // Finalizador de cardio para perda de peso / condicionamento
      if (params.cardioFinal) {
        const cardio = EXERCISES
          .filter(e => e.grupo === 'cardio' && disponivel(e, profile.equipamentos))[0];
        if (cardio) exercicios.push({ exId: cardio.id, series: 1, reps: cardio.repsFixo, descanso: 0, carga: null });
      }

      return {
        id: `d${i + 1}`,
        foco: tpl.foco,
        exercicios,
        tempoEstimado: estimarTempo(exercicios),
      };
    });

    return {
      criadoEm: new Date().toISOString(),
      semana: 1,
      split: descreverSplit(profile.dias, profile.nivel),
      dias,
    };
  }

  function descreverSplit(dias, nivel) {
    if (dias === 2) return 'Full Body 2x';
    if (dias === 3) return nivel === 'iniciante' ? 'Full Body 3x' : 'Push / Pull / Legs';
    if (dias === 4) return 'Superiores / Inferiores';
    if (dias === 5) return 'PPL + Sup/Inf';
    if (dias === 6) return 'Push / Pull / Legs 2x';
    return 'Full Body';
  }

  /* Estimativa simples de duração (min) */
  function estimarTempo(exercicios) {
    let seg = 0;
    exercicios.forEach(e => {
      const execPorSerie = 35; // ~35s executando
      seg += e.series * (execPorSerie + (e.descanso || 0));
    });
    return Math.max(15, Math.round(seg / 60) + 5); // +5 aquecimento
  }

  /* --------- Substituição de exercício (funcionalidade pedida) --------- */
  /* Alternativas que treinam o MESMO grupo, com o equipamento disponível. */
  function alternativas(origId, profile) {
    const orig = byId(origId);
    if (!orig) return [];
    const max = nivelMax(profile.nivel);
    return EXERCISES
      .filter(ex => ex.id !== origId)
      .filter(ex => ex.grupo === orig.grupo || (ex.sec || []).includes(orig.grupo))
      .filter(ex => disponivel(ex, profile.equipamentos))
      .filter(ex => ex.nivel <= max)
      .sort((a, b) => {
        // prioriza mesmo padrão de movimento e mesmo grupo primário
        const sa = (a.mov === orig.mov ? 0 : 1) + (a.grupo === orig.grupo ? 0 : 1);
        const sb = (b.mov === orig.mov ? 0 : 1) + (b.grupo === orig.grupo ? 0 : 1);
        return sa - sb;
      });
  }

  function byId(id) { return EXERCISES.find(e => e.id === id); }

  /* ==================================================================
     SOBRECARGA PROGRESSIVA (dupla progressão)
     Usa o último registro do exercício + RPE para sugerir a carga.
     ================================================================== */
  const GRUPOS_INFERIORES = ['quadriceps','posterior','gluteos','adutores','panturrilha'];
  function incrementoCarga(grupo) { return GRUPOS_INFERIORES.includes(grupo) ? 5 : 2.5; }
  function arredondaCarga(x) { return Math.round(x / 2.5) * 2.5; }
  function topoReps(reps) { const n = String(reps).match(/\d+/g); return n ? +n[n.length - 1] : null; }

  // Retorna { carga, delta, motivo, anterior } ou null se não houver histórico
  function sugerirCarga(exId, item, logs, opts = {}) {
    const rel = (logs || []).filter(l => l.exId === exId && l.sets.some(s => s.carga));
    if (!rel.length) return null;
    const last = rel[rel.length - 1];
    const lastCarga = Math.max(...last.sets.map(s => s.carga || 0));
    if (!lastCarga) return null;

    const ex = byId(exId);
    const top = topoReps(item.reps);
    const bestReps = Math.max(...last.sets.map(s => s.reps || 0));
    const hitTop = top && bestReps >= top;
    const rpe = last.rpe;
    const inc = incrementoCarga(ex ? ex.grupo : '');

    // Semana de deload: reduz ~10% para recuperação
    if (opts.deload) {
      return { carga: arredondaCarga(lastCarga * 0.9), delta: 0, motivo: 'deload', anterior: lastCarga };
    }
    // Progressão: bateu o topo das reps e esforço não foi máximo
    if (hitTop && (rpe == null || rpe <= 8)) {
      return { carga: lastCarga + inc, delta: inc, motivo: 'progressao', anterior: lastCarga };
    }
    // Muito difícil ou não completou: mantém
    if (rpe >= 9 || (top && bestReps < top)) {
      return { carga: lastCarga, delta: 0, motivo: 'manter', anterior: lastCarga };
    }
    // Caso intermediário: mantém carga, tenta subir reps
    return { carga: lastCarga, delta: 0, motivo: 'reps', anterior: lastCarga };
  }

  /* ==================================================================
     AJUSTE DE TEMPO — encurta/alonga o treino p/ o tempo disponível
     ================================================================== */
  function ajustarTempo(dia, minutos) {
    const ex = dia.exercicios.map(e => ({ ...e }));
    const t = () => estimarTempo(ex);
    if (t() <= minutos) return { ...dia, exercicios: ex, tempoEstimado: t(), ajustadoPara: minutos };

    // 1) remove isolados (do fim), preservando compostos e core
    for (let i = ex.length - 1; i >= 0 && t() > minutos; i--) {
      const b = byId(ex[i].exId);
      if (b && b.tipo === 'isolado' && b.grupo !== 'core') ex.splice(i, 1);
    }
    // 2) reduz séries (mínimo 2)
    if (t() > minutos) ex.forEach(e => { if (e.series > 2) e.series = 2; });
    // 3) ainda longo: remove do fim, mantendo ao menos 3 exercícios
    while (t() > minutos && ex.length > 3) ex.pop();

    return { ...dia, exercicios: ex, tempoEstimado: t(), ajustadoPara: minutos };
  }

  return { generate, alternativas, byId, OBJ_PARAMS, sugerirCarga, ajustarTempo };
})();
