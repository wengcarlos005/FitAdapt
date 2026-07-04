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

  /* Áreas de prioridade escolhidas pelo usuário -> grupos musculares */
  const AREA_GRUPOS = {
    pernas:  ['gluteos', 'quadriceps', 'posterior'],
    bracos:  ['biceps', 'triceps'],
    peito:   ['peito'],
    costas:  ['costas'],
    ombros:  ['ombro'],
    abdomen: ['core'],
  };
  function gruposFoco(profile) {
    const out = [];
    (profile.foco || []).forEach(a => (AREA_GRUPOS[a] || []).forEach(g => out.push(g)));
    return out;
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

  /* Pontuação de adequação de um exercício ao PERFIL (objetivo, idade, nível) */
  function scoreExercicio(ex, profile) {
    let s = 0;
    // Compostos: mais valorizados p/ ganho de massa e perda de peso (gasto/estímulo)
    if (ex.tipo === 'composto') s += profile.objetivo === 'condicionamento' ? 1.5 : 2.5;
    // Perda de peso: também valoriza cardio/funcional
    if (profile.objetivo === 'perda_peso' && (ex.tipo === 'cardio' || ex.grupo === 'core')) s += 1;
    // Idade avançada: prioriza exercícios mais fáceis/seguros
    if (profile.idade >= 50) s += (3 - ex.nivel) * 1.2;
    else if (profile.nivel === 'avancado') s += ex.nivel * 0.3; // avançado tolera mais dificuldade
    // Iniciantes: máquinas são mais seguras/fáceis de aprender
    if (profile.nivel === 'iniciante' && ex.equip.includes('maquinas')) s += 1.2;
    // Avançado: peso livre (barra) é priorizado
    if (profile.nivel === 'avancado' && ex.equip.includes('barra')) s += 0.8;
    return s;
  }

  /* Candidatos para um grupo muscular, ordenados por adequação ao perfil */
  function candidatos(grupo, profile) {
    const max = nivelMax(profile.nivel);
    return EXERCISES
      .filter(ex => ex.grupo === grupo)
      .filter(ex => disponivel(ex, profile.equipamentos))
      .filter(ex => ex.nivel <= max)
      .sort((a, b) => scoreExercicio(b, profile) - scoreExercicio(a, profile));
  }

  /* Gera a ficha semanal completa.
     `semana` (periodização) e `variante` (botão "variar") deslocam a rotação
     -> trazem exercícios diferentes mantendo a estrutura adequada ao perfil. */
  function generate(profile, semana = 1, variante = 0) {
    const params = OBJ_PARAMS[profile.objetivo] || OBJ_PARAMS.condicionamento;
    const split = montarSplit(profile.dias, profile.nivel);
    const usados = new Set();
    let giGlobal = 0; // posição global do grupo (varia a escolha entre dias)
    const rot = (semana - 1) + variante;
    const foco = gruposFoco(profile); // grupos priorizados pelo usuário

    // Escolhe um exercício do grupo, rotacionando e evitando repetição
    function escolher(grupo, base) {
      const cand = candidatos(grupo, profile);
      if (!cand.length) return null;
      for (let k = 0; k < cand.length; k++) {
        const c = cand[(base + k) % cand.length];
        if (!usados.has(c.id)) { usados.add(c.id); return c; }
      }
      const c = cand[base % cand.length]; // pool pequeno: pode repetir
      usados.add(c.id);
      return c;
    }
    function push(exercicios, ex, prioridade) {
      const isCore = ex.grupo === 'core';
      exercicios.push({
        exId: ex.id,
        series: isCore ? 3 : params.series,
        reps: ex.repsFixo || params.reps,
        descanso: isCore ? 45 : params.descanso,
        carga: null,
        foco: !!prioridade,
      });
    }

    const dias = split.map((key, i) => {
      const tpl = TEMPLATES[key];
      const exercicios = [];

      tpl.grupos.forEach(grupo => {
        const ex = escolher(grupo, rot + (giGlobal++));
        if (ex) push(exercicios, ex, foco.includes(grupo));
      });

      // Volume EXTRA nas áreas que o usuário quer priorizar (1 por dia, rotacionando)
      if (foco.length) {
        const grupoFoco = foco[(rot + i) % foco.length];
        const ex = escolher(grupoFoco, rot + i);
        if (ex) push(exercicios, ex, true);
      }

      // Finalizador de cardio para perda de peso / condicionamento
      if (params.cardioFinal) {
        const cardios = EXERCISES.filter(e => e.grupo === 'cardio' && disponivel(e, profile.equipamentos));
        if (cardios.length) {
          const cardio = cardios[(rot + i) % cardios.length]; // varia o cardio também
          exercicios.push({ exId: cardio.id, series: 1, reps: cardio.repsFixo, descanso: 0, carga: null });
        }
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
      semana,
      variante,
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
     AJUSTE DE TEMPO — encurta OU alonga o treino p/ o tempo disponível
     `profile` é opcional: quando informado, permite ADICIONAR exercícios
     ao alongar (sem ele, alonga apenas somando séries).
     ================================================================== */
  function ajustarTempo(dia, minutos, profile) {
    const ex = dia.exercicios.map(e => ({ ...e }));
    const t = () => estimarTempo(ex);

    if (t() > minutos) {
      encurtar(ex, minutos, t);
    } else if (t() < minutos - 4) {
      alongar(ex, minutos, t, profile);
    }

    return { ...dia, exercicios: ex, tempoEstimado: t(), ajustadoPara: minutos };
  }

  /* Encurta: tira isolados, reduz séries, e por fim remove do fim. */
  function encurtar(ex, minutos, t) {
    // 1) remove isolados (do fim), preservando compostos e core
    for (let i = ex.length - 1; i >= 0 && t() > minutos; i--) {
      const b = byId(ex[i].exId);
      if (b && b.tipo === 'isolado' && b.grupo !== 'core') ex.splice(i, 1);
    }
    // 2) reduz séries (mínimo 2)
    if (t() > minutos) ex.forEach(e => { if (e.series > 2) e.series = 2; });
    // 3) ainda longo: remove do fim, mantendo ao menos 3 exercícios
    while (t() > minutos && ex.length > 3) ex.pop();
  }

  /* Custo (min) de uma série a mais, dado o descanso. */
  function custoSerie(descanso) { return (35 + (descanso || 0)) / 60; }

  /* Alonga: primeiro soma séries aos principais, depois adiciona exercícios
     acessórios dos grupos já presentes no dia (se houver perfil). */
  function alongar(ex, minutos, t, profile) {
    const params = (profile && OBJ_PARAMS[profile.objetivo]) || OBJ_PARAMS.condicionamento;
    const maxSeries = profile && profile.objetivo === 'ganho_massa' ? 5 : 4;

    // 1) soma séries — compostos primeiro, em rodízio, respeitando o teto
    let progrediu = true;
    while (progrediu && t() < minutos - 1) {
      progrediu = false;
      const alvos = ex.filter(e => {
        const b = byId(e.exId);
        return b && b.tipo !== 'cardio' && b.grupo !== 'core' && e.series < maxSeries;
      }).sort((a, b) => {
        const ba = byId(a.exId), bb = byId(b.exId);
        return (bb.tipo === 'composto') - (ba.tipo === 'composto');
      });
      for (const e of alvos) {
        if (t() + custoSerie(e.descanso) > minutos) continue;
        e.series++;
        progrediu = true;
        if (t() >= minutos - 1) break;
      }
    }

    // 2) sobrou tempo -> adiciona exercícios acessórios (precisa do perfil)
    if (!profile) return;
    const usados = new Set(ex.map(e => e.exId));
    const grupos = [...new Set(
      ex.map(e => (byId(e.exId) || {}).grupo).filter(g => g && g !== 'cardio')
    )];
    if (!grupos.length) return;

    const cardioIdx = ex.findIndex(e => (byId(e.exId) || {}).grupo === 'cardio');
    let gi = 0, tentativas = 0, semAdicao = 0;
    // margem de ~6 min: só adiciona exercício se realmente couber
    while (t() < minutos - 6 && semAdicao < grupos.length) {
      const grupo = grupos[gi % grupos.length]; gi++; tentativas++;
      const nov = candidatos(grupo, profile).find(c => !usados.has(c.id));
      if (!nov) { semAdicao++; if (tentativas > grupos.length * 3) break; continue; }
      semAdicao = 0;
      const isCore = nov.grupo === 'core';
      const item = {
        exId: nov.id,
        series: isCore ? 3 : params.series,
        reps: nov.repsFixo || params.reps,
        descanso: isCore ? 45 : params.descanso,
        carga: null,
        extra: true, // marca como adicionado pelo ajuste de tempo
      };
      // insere antes do cardio final, se houver
      const idx = ex.findIndex(e => (byId(e.exId) || {}).grupo === 'cardio');
      if (idx === -1) ex.push(item); else ex.splice(idx, 0, item);
      usados.add(nov.id);
    }
  }

  return { generate, alternativas, byId, OBJ_PARAMS, sugerirCarga, ajustarTempo };
})();
