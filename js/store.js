/* ==========================================================================
   FitAdapt — Camada de dados (localStorage)
   Passo 1: só o esqueleto. Cresce a cada passo (perfil, ficha, logs...).
   ========================================================================== */

const Store = (() => {
  const KEY = 'fitadapt.v1';

  // Estado padrão. Nos próximos passos preenchemos profile/plan/logs.
  const defaultState = {
    onboarded: false,
    user: { nome: 'Atleta' },
    profile: null,     // { peso, altura, idade, nivel, objetivo, dias, tempo, equipamentos }
    plan: null,        // ficha semanal gerada pelo algoritmo
    substitutions: {}, // { exId_original: exId_substituto } — trocas persistentes
    planCursor: 0,     // índice do próximo treino do rodízio
    logs: [],          // registros de carga por exercício
    feedbacks: [],     // avaliações pós-treino (sessões concluídas)
    streak: 0,
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  return {
    get: () => state,
    set(patch) { state = { ...state, ...patch }; save(); return state; },
    reset() { state = { ...defaultState, substitutions: {} }; save(); return state; },

    // Substituições de exercício (persistentes)
    setSub(origId, novoId) {
      state.substitutions = { ...state.substitutions, [origId]: novoId };
      save();
    },
    clearSub(origId) {
      const s = { ...state.substitutions };
      delete s[origId];
      state.substitutions = s;
      save();
    },
    // Resolve o exercício efetivo (aplica substituição, se houver)
    resolve(origId) { return state.substitutions[origId] || origId; },

    // Avança o rodízio de treinos (dia concluído -> próximo)
    advanceCursor(total) {
      state.planCursor = total ? ((state.planCursor + 1) % total) : 0;
      save();
      return state.planCursor;
    },
    addFeedback(fb) { state.feedbacks = state.feedbacks.concat(fb); save(); },
  };
})();
