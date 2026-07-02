/* ==========================================================================
   FitAdapt — Onboarding (Passo 2)
   Fluxo de 6 telas -> monta o perfil e salva no Store.
   Uma pergunta por tela para reduzir abandono.
   ========================================================================== */

const Onboarding = (() => {
  const el = document.getElementById('app');
  let step = 0;
  let onComplete = null;

  // Rascunho do perfil, preenchido ao longo das telas
  let draft = {
    nome: '',
    sexo: '',
    idade: null,
    peso: null,
    altura: null,
    objetivo: '',
    nivel: '',
    dias: null,
    tempo: null,
    equipamentos: ['peso_corporal'],
  };

  const steps = [
    stepObjetivo,   // 0
    stepDados,      // 1
    stepNivel,      // 2
    stepRotina,     // 3
    stepEquip,      // 4
    stepWelcome,    // 5
  ];

  function start(cb) {
    onComplete = cb;
    step = 0;
    render();
  }

  function render() {
    el.innerHTML = '';
    const view = steps[step]();
    view.classList.add('fade-in');
    el.appendChild(view);
    el.scrollTop = 0;
  }

  function next() { if (step < steps.length - 1) { step++; render(); } }
  function back() { if (step > 0) { step--; render(); } }

  /* Shell reutilizável: progresso + conteúdo + rodapé */
  function shell(inner, { canNext, nextLabel = 'Continuar', showBack = true, onNext } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'onb';

    const dots = steps.slice(0, 5).map((_, i) =>
      `<div class="dot ${i <= step ? 'done' : ''}"></div>`).join('');

    wrap.innerHTML = `
      <div class="onb-progress">${dots}</div>
      <div class="onb-step"></div>
      <div class="onb-footer">
        ${showBack && step > 0 ? '<button class="btn secondary back" id="obBack">←</button>' : ''}
        <button class="btn" id="obNext" ${canNext ? '' : 'disabled style="opacity:.4;pointer-events:none"'}>${nextLabel}</button>
      </div>
    `;
    wrap.querySelector('.onb-step').appendChild(inner);
    const backBtn = wrap.querySelector('#obBack');
    if (backBtn) backBtn.addEventListener('click', back);
    wrap.querySelector('#obNext').addEventListener('click', () => (onNext || next)());
    return wrap;
  }

  function refresh() { render(); } // re-render para atualizar estado do botão

  /* ---------------------- Tela 0: Objetivo ---------------------- */
  function stepObjetivo() {
    const opts = [
      { v: 'perda_peso',      ico: '🔥', t: 'Perder peso',       d: 'Queimar gordura e definir' },
      { v: 'ganho_massa',     ico: '💪', t: 'Ganhar massa',      d: 'Hipertrofia e força' },
      { v: 'condicionamento', ico: '⚡', t: 'Condicionamento',   d: 'Resistência e saúde geral' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Qual é o seu objetivo?</div>
      <div class="onb-sub">Isso define a estrutura do seu treino.</div>
      <div class="option-list">
        ${opts.map(o => `
          <div class="option ${draft.objetivo === o.v ? 'selected' : ''}" data-v="${o.v}">
            <div class="ico">${o.ico}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">✓</div>
          </div>`).join('')}
      </div>
    `;
    c.querySelectorAll('.option').forEach(op =>
      op.addEventListener('click', () => { draft.objetivo = op.dataset.v; refresh(); }));
    return shell(c, { canNext: !!draft.objetivo });
  }

  /* ---------------------- Tela 1: Dados ---------------------- */
  function stepDados() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Sobre você</div>
      <div class="onb-sub">Usamos para calcular cargas e gasto calórico.</div>

      <div class="field">
        <label>Como podemos te chamar?</label>
        <input class="input" id="fNome" placeholder="Seu nome" value="${draft.nome}" />
      </div>

      <div class="field">
        <label>Sexo biológico</label>
        <div class="chips">
          <div class="chip ${draft.sexo === 'masculino' ? 'selected' : ''}" data-sexo="masculino">Masculino</div>
          <div class="chip ${draft.sexo === 'feminino' ? 'selected' : ''}" data-sexo="feminino">Feminino</div>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Idade</label>
          <div class="suffix-wrap">
            <input class="input" id="fIdade" type="number" inputmode="numeric" placeholder="30" value="${draft.idade ?? ''}" />
            <span class="suffix">anos</span>
          </div>
        </div>
        <div class="field">
          <label>Peso</label>
          <div class="suffix-wrap">
            <input class="input" id="fPeso" type="number" inputmode="decimal" placeholder="78" value="${draft.peso ?? ''}" />
            <span class="suffix">kg</span>
          </div>
        </div>
      </div>

      <div class="field">
        <label>Altura</label>
        <div class="suffix-wrap">
          <input class="input" id="fAltura" type="number" inputmode="numeric" placeholder="175" value="${draft.altura ?? ''}" />
          <span class="suffix">cm</span>
        </div>
      </div>
    `;
    // sincroniza inputs em tempo real
    const bind = (id, key, num) => {
      const inp = c.querySelector(id);
      inp.addEventListener('input', () => {
        draft[key] = num ? (parseFloat(inp.value) || null) : inp.value.trim();
        toggleNext();
      });
    };
    bind('#fNome', 'nome', false);
    bind('#fIdade', 'idade', true);
    bind('#fPeso', 'peso', true);
    bind('#fAltura', 'altura', true);
    c.querySelectorAll('[data-sexo]').forEach(ch =>
      ch.addEventListener('click', () => { draft.sexo = ch.dataset.sexo; refresh(); }));

    const valid = () => draft.nome && draft.sexo && draft.idade && draft.peso && draft.altura;
    const view = shell(c, { canNext: valid() });
    // atualiza o botão sem re-render (para não perder foco do input)
    function toggleNext() {
      const btn = view.querySelector('#obNext');
      const ok = valid();
      btn.disabled = !ok;
      btn.style.opacity = ok ? '1' : '.4';
      btn.style.pointerEvents = ok ? 'auto' : 'none';
    }
    return view;
  }

  /* ---------------------- Tela 2: Nível ---------------------- */
  function stepNivel() {
    const opts = [
      { v: 'iniciante',    ico: '🌱', t: 'Iniciante',    d: 'Pouca ou nenhuma experiência' },
      { v: 'intermediario',ico: '🔥', t: 'Intermediário', d: 'Treino há alguns meses' },
      { v: 'avancado',     ico: '🏆', t: 'Avançado',     d: 'Treino consistente há mais de 1 ano' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Seu nível de condicionamento</div>
      <div class="onb-sub">Ajustamos volume e dificuldade dos exercícios.</div>
      <div class="option-list">
        ${opts.map(o => `
          <div class="option ${draft.nivel === o.v ? 'selected' : ''}" data-v="${o.v}">
            <div class="ico">${o.ico}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">✓</div>
          </div>`).join('')}
      </div>
    `;
    c.querySelectorAll('.option').forEach(op =>
      op.addEventListener('click', () => { draft.nivel = op.dataset.v; refresh(); }));
    return shell(c, { canNext: !!draft.nivel });
  }

  /* ---------------------- Tela 3: Rotina (dias + tempo) ---------------------- */
  function stepRotina() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Sua disponibilidade</div>
      <div class="onb-sub">Quantos dias por semana e quanto tempo por sessão.</div>

      <div class="field">
        <label>Dias por semana</label>
        <div class="chips">
          ${[2,3,4,5,6].map(d => `
            <div class="chip big ${draft.dias === d ? 'selected' : ''}" data-dias="${d}">${d}</div>`).join('')}
        </div>
      </div>

      <div class="field">
        <label>Tempo por treino</label>
        <div class="chips">
          ${[
            {v:30,t:'30 min'},{v:45,t:'45 min'},{v:60,t:'1 hora'},{v:90,t:'1h30'}
          ].map(o => `
            <div class="chip big ${draft.tempo === o.v ? 'selected' : ''}" data-tempo="${o.v}">${o.t}</div>`).join('')}
        </div>
      </div>
    `;
    c.querySelectorAll('[data-dias]').forEach(ch =>
      ch.addEventListener('click', () => { draft.dias = +ch.dataset.dias; refresh(); }));
    c.querySelectorAll('[data-tempo]').forEach(ch =>
      ch.addEventListener('click', () => { draft.tempo = +ch.dataset.tempo; refresh(); }));
    return shell(c, { canNext: !!(draft.dias && draft.tempo) });
  }

  /* ---------------------- Tela 4: Equipamentos ---------------------- */
  function stepEquip() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">O que você tem disponível?</div>
      <div class="onb-sub">Só vamos sugerir exercícios que você consegue fazer.</div>
      <div class="equip-grid">
        ${EQUIPMENT.map(e => `
          <div class="equip ${draft.equipamentos.includes(e.id) ? 'selected' : ''} ${e.base ? 'locked' : ''}"
               data-id="${e.id}">
            <span class="e-ico">${e.ico}</span>${e.nome}
          </div>`).join('')}
      </div>
      <p style="color:var(--text-mut);font-size:12px;margin-top:14px">
        "Peso corporal" fica sempre ativo como base.
      </p>
    `;
    c.querySelectorAll('.equip').forEach(eq => {
      const id = eq.dataset.id;
      const base = EQUIPMENT.find(e => e.id === id).base;
      eq.addEventListener('click', () => {
        if (base) return; // não desmarca peso corporal
        if (draft.equipamentos.includes(id))
          draft.equipamentos = draft.equipamentos.filter(x => x !== id);
        else
          draft.equipamentos.push(id);
        refresh();
      });
    });
    return shell(c, {
      canNext: true,
      nextLabel: 'Criar meu plano',
      onNext: finish,
    });
  }

  /* ---------------------- Tela 5: Boas-vindas ---------------------- */
  function finish() {
    // Persiste o perfil
    Store.set({
      onboarded: true,
      user: { nome: draft.nome },
      profile: { ...draft },
    });
    step = 5;
    render();
  }

  function stepWelcome() {
    const c = document.createElement('div');
    c.className = 'welcome';
    c.innerHTML = `
      <div class="big">🎉</div>
      <h2>Tudo pronto, ${draft.nome}!</h2>
      <p>Seu perfil foi criado. No próximo passo o algoritmo vai montar sua ficha semanal personalizada.</p>
      <button class="btn" id="goHome" style="max-width:220px">Ir para o app</button>
    `;
    c.querySelector('#goHome').addEventListener('click', () => onComplete && onComplete());
    return c;
  }

  return { start };
})();
