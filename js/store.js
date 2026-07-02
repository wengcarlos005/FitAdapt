/* ==========================================================================
   FitAdapt — Camada de dados (localStorage), por usuário
   Cada conta guarda seu próprio progresso em fitadapt.v1.<email>.
   ========================================================================== */

const Store = (() => {
  let userKey = null; // e-mail do usuário logado

  const defaultState = () => ({
    onboarded: false,
    user: { nome: 'Atleta' },
    profile: null,
    plan: null,
    substitutions: {},
    planCursor: 0,
    logs: [],
    feedbacks: [],
    streak: 0,
  });

  let state = defaultState();

  const keyFor = u => 'fitadapt.v1.' + (u || '_anon');

  function load() {
    try {
      const raw = localStorage.getItem(keyFor(userKey));
      return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
    } catch {
      return defaultState();
    }
  }
  function save() {
    if (userKey == null) return;
    localStorage.setItem(keyFor(userKey), JSON.stringify(state));
  }

  return {
    // Define o usuário atual e carrega o estado dele
    setUser(u) { userKey = u; state = load(); return state; },
    currentUser: () => userKey,

    get: () => state,
    set(patch) { state = { ...state, ...patch }; save(); return state; },
    reset() { state = defaultState(); save(); return state; },

    setSub(origId, novoId) { state.substitutions = { ...state.substitutions, [origId]: novoId }; save(); },
    clearSub(origId) { const s = { ...state.substitutions }; delete s[origId]; state.substitutions = s; save(); },
    resolve(origId) { return state.substitutions[origId] || origId; },

    advanceCursor(total) { state.planCursor = total ? ((state.planCursor + 1) % total) : 0; save(); return state.planCursor; },
    addFeedback(fb) { state.feedbacks = state.feedbacks.concat(fb); save(); },
  };
})();
