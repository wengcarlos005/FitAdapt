/* ==========================================================================
   FitAdapt — Onboarding
   Uma pergunta por tela (telas curtas e limpas), seleção sem re-render.
   "Sobre você" dividido em telas: nome, sexo, idade, peso, altura.
   Idade/peso/altura com limites de intervalo.
   ========================================================================== */

const Onboarding = (() => {
  const el = document.getElementById('app');
  let step = 0;
  let onComplete = null;

  const LIM = { idade: [12, 99], peso: [30, 250], altura: [120, 230] };

  let draft = {
    nome: '', sexo: '', idade: null, peso: null, altura: null,
    objetivo: '', foco: [], nivel: '', dias: null, tempo: null,
    local: '', equipamentos: ['peso_corporal'],
  };

  const PRESETS = {
    academia: ['peso_corporal','halteres','barra','maquinas','polia','kettlebell','banco','barra_fixa','cardio'],
    casa:     ['peso_corporal','halteres','elastico','banco'],
    livre:    ['peso_corporal'],
  };

  const steps = [stepObjetivo, stepFoco, stepNome, stepSexo, stepIdade, stepPeso, stepAltura, stepNivel, stepRotina, stepLocal, stepWelcome];
  const N_DOTS = steps.length - 1;

  function start(cb) {
    onComplete = cb;
    if (!draft.nome && typeof Auth !== 'undefined') draft.nome = Auth.currentName() || '';
    step = 0; render();
  }
  function render() {
    el.innerHTML = '';
    const v = steps[step]();
    v.classList.add('fade-in');
    el.appendChild(v);
    el.scrollTop = 0;
  }
  function next() { if (step < steps.length - 1) { step++; render(); } }
  function back() { if (step > 0) { step--; render(); } }

  function shell(inner, { canNext, nextLabel = 'Continuar', onNext } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'onb';
    const dots = Array.from({ length: N_DOTS }, (_, i) => `<div class="dot ${i <= step ? 'done' : ''}"></div>`).join('');
    wrap.innerHTML = `
      <div class="onb-progress">${dots}</div>
      <div class="onb-step"></div>
      <div class="onb-footer">
        ${step > 0 ? '<button class="btn secondary back" id="obBack">←</button>' : ''}
        <button class="btn" id="obNext">${nextLabel}</button>
      </div>`;
    wrap.querySelector('.onb-step').appendChild(inner);
    const bk = wrap.querySelector('#obBack');
    if (bk) bk.addEventListener('click', back);
    wrap.querySelector('#obNext').addEventListener('click', () => (onNext || next)());
    setTimeout(() => setNext(canNext), 0);
    return wrap;
  }
  function setNext(enabled) {
    const b = el.querySelector('#obNext');
    if (!b) return;
    b.disabled = !enabled;
    b.style.opacity = enabled ? '1' : '.4';
    b.style.pointerEvents = enabled ? 'auto' : 'none';
  }
  function selectOne(container, clicked, sel) {
    container.querySelectorAll(sel).forEach(x => x.classList.toggle('selected', x === clicked));
  }

  /* opção única (objetivo/nível) */
  function optionStep(q, sub, opts, key) {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">${q}</div>
      <div class="onb-sub">${sub}</div>
      <div class="option-list">
        ${opts.map(o => `
          <div class="option ${draft[key] === o.v ? 'selected' : ''}" data-v="${o.v}">
            <div class="ico">${Icons.svg(o.ic)}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">${Icons.svg('check')}</div>
          </div>`).join('')}
      </div>`;
    c.querySelectorAll('.option').forEach(op => op.addEventListener('click', () => {
      draft[key] = op.dataset.v; selectOne(c, op, '.option'); setNext(true);
    }));
    return shell(c, { canNext: !!draft[key] });
  }

  /* campo numérico com limite */
  function numStep(q, sub, key, unit, placeholder) {
    const [min, max] = LIM[key];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">${q}</div>
      <div class="onb-sub">${sub}</div>
      <div class="big-input">
        <input class="input xl" id="nf" type="number" inputmode="numeric" placeholder="${placeholder}" value="${draft[key] ?? ''}">
        <span class="xl-unit">${unit}</span>
      </div>
      <p class="onb-hint" id="nfHint" hidden></p>`;
    const inp = c.querySelector('#nf');
    const hint = c.querySelector('#nfHint');
    const valid = v => v >= min && v <= max;
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value) || null;
      draft[key] = v;
      const ok = valid(v);
      if (inp.value && !ok) { hint.hidden = false; hint.textContent = `Informe um valor entre ${min} e ${max} ${unit}.`; }
      else hint.hidden = true;
      setNext(ok);
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && valid(parseFloat(inp.value))) next(); });
    setTimeout(() => inp.focus(), 60);
    return shell(c, { canNext: valid(draft[key]) });
  }

  /* ------- 0: Objetivo ------- */
  function stepObjetivo() {
    return optionStep('Qual é o seu objetivo?', 'Define a estrutura do seu treino.', [
      { v:'perda_peso', ic:'flame', t:'Perder peso', d:'Queimar gordura e definir' },
      { v:'ganho_massa', ic:'dumbbell', t:'Ganhar massa', d:'Hipertrofia e força' },
      { v:'condicionamento', ic:'cardio', t:'Condicionamento', d:'Resistência e saúde' },
    ], 'objetivo');
  }

  /* ------- 1: Foco (áreas a priorizar) ------- */
  function stepFoco() {
    const areas = [
      { v:'pernas',  t:'Pernas e glúteos' },
      { v:'bracos',  t:'Braços' },
      { v:'peito',   t:'Peito' },
      { v:'costas',  t:'Costas' },
      { v:'ombros',  t:'Ombros' },
      { v:'abdomen', t:'Abdômen' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">O que você quer priorizar?</div>
      <div class="onb-sub">Damos volume extra nessas áreas. Escolha uma ou mais — ou nenhuma.</div>
      <div class="chips foco-chips">
        ${areas.map(a => `<div class="chip big ${draft.foco.includes(a.v) ? 'selected' : ''}" data-foco="${a.v}">${a.t}</div>`).join('')}
      </div>
      <p class="equip-hint">Sem seleção = treino equilibrado (corpo todo).</p>`;
    c.querySelectorAll('[data-foco]').forEach(ch => ch.addEventListener('click', () => {
      const v = ch.dataset.foco;
      if (draft.foco.includes(v)) draft.foco = draft.foco.filter(x => x !== v);
      else draft.foco.push(v);
      ch.classList.toggle('selected');
    }));
    return shell(c, { canNext: true }); // opcional
  }

  /* ------- 2: Nome ------- */
  function stepNome() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Como podemos te chamar?</div>
      <div class="onb-sub">Vamos usar no app.</div>
      <input class="input xl-text" id="nf" placeholder="Seu nome" value="${draft.nome}">`;
    const inp = c.querySelector('#nf');
    inp.addEventListener('input', () => { draft.nome = inp.value.trim(); setNext(!!draft.nome); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && draft.nome) next(); });
    setTimeout(() => inp.focus(), 60);
    return shell(c, { canNext: !!draft.nome });
  }

  /* ------- 2: Sexo ------- */
  function stepSexo() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Sexo biológico</div>
      <div class="onb-sub">Para calcular gasto calórico e cargas.</div>
      <div class="option-list">
        ${[{v:'masculino',t:'Masculino'},{v:'feminino',t:'Feminino'}].map(o => `
          <div class="option ${draft.sexo===o.v?'selected':''}" data-v="${o.v}">
            <div class="txt"><b>${o.t}</b></div><div class="check">${Icons.svg('check')}</div>
          </div>`).join('')}
      </div>`;
    c.querySelectorAll('.option').forEach(op => op.addEventListener('click', () => {
      draft.sexo = op.dataset.v; selectOne(c, op, '.option'); setNext(true);
    }));
    return shell(c, { canNext: !!draft.sexo });
  }

  /* ------- 3/4/5: Idade / Peso / Altura ------- */
  function stepIdade()  { return numStep('Qual sua idade?', 'Ajuda a calibrar a intensidade.', 'idade', 'anos', '30'); }
  function stepPeso()   { return numStep('Qual seu peso?', 'Base para carga e progressão.', 'peso', 'kg', '75'); }
  function stepAltura() { return numStep('Qual sua altura?', 'Usada no cálculo do seu IMC.', 'altura', 'cm', '175'); }

  /* ------- 6: Nível ------- */
  function stepNivel() {
    return optionStep('Seu nível', 'Ajustamos volume e dificuldade.', [
      { v:'iniciante', ic:'sprout', t:'Iniciante', d:'Pouca ou nenhuma experiência' },
      { v:'intermediario', ic:'dumbbell', t:'Intermediário', d:'Treina há alguns meses' },
      { v:'avancado', ic:'trophy', t:'Avançado', d:'Treina há mais de 1 ano' },
    ], 'nivel');
  }

  /* ------- 7: Rotina ------- */
  function stepRotina() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Sua rotina</div>
      <div class="onb-sub">Dias por semana e tempo por treino.</div>
      <div class="field"><label>Dias por semana</label>
        <div class="chips">${[2,3,4,5,6].map(d => `<div class="chip big ${draft.dias===d?'selected':''}" data-dias="${d}">${d}</div>`).join('')}</div>
      </div>
      <div class="field"><label>Tempo por treino</label>
        <div class="chips">${[{v:30,t:'30 min'},{v:45,t:'45 min'},{v:60,t:'1h'},{v:90,t:'1h30'}].map(o => `<div class="chip big ${draft.tempo===o.v?'selected':''}" data-tempo="${o.v}">${o.t}</div>`).join('')}</div>
      </div>`;
    const ok = () => !!(draft.dias && draft.tempo);
    c.querySelectorAll('[data-dias]').forEach(ch => ch.addEventListener('click', () => {
      draft.dias = +ch.dataset.dias; c.querySelectorAll('[data-dias]').forEach(x => x.classList.toggle('selected', x===ch)); setNext(ok());
    }));
    c.querySelectorAll('[data-tempo]').forEach(ch => ch.addEventListener('click', () => {
      draft.tempo = +ch.dataset.tempo; c.querySelectorAll('[data-tempo]').forEach(x => x.classList.toggle('selected', x===ch)); setNext(ok());
    }));
    return shell(c, { canNext: ok() });
  }

  /* ------- 8: Local + equipamentos ------- */
  function stepLocal() {
    const locais = [
      { v:'academia', ic:'building', t:'Academia', d:'Máquinas e pesos livres' },
      { v:'casa', ic:'home', t:'Em casa', d:'Halteres, elásticos, banco' },
      { v:'livre', ic:'person', t:'Só peso corporal', d:'Sem equipamento' },
      { v:'custom', ic:'sliders', t:'Personalizar', d:'Escolher o que tenho' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Onde você treina?</div>
      <div class="onb-sub">Só sugerimos o que você consegue fazer.</div>
      <div class="option-list">
        ${locais.map(o => `
          <div class="option ${draft.local===o.v?'selected':''}" data-loc="${o.v}">
            <div class="ico">${Icons.svg(o.ic)}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">${Icons.svg('check')}</div>
          </div>`).join('')}
      </div>
      <div class="equip-custom" id="equipCustom" hidden>
        <div class="equip-grid">
          ${EQUIPMENT.map(e => `
            <div class="equip ${draft.equipamentos.includes(e.id)?'selected':''} ${e.base?'base':''}" data-id="${e.id}">
              <span class="e-ico">${Icons.equip(e.id)}</span>${e.nome}
            </div>`).join('')}
        </div>
        <p class="equip-hint">"Peso corporal" fica sempre ativo.</p>
      </div>`;
    const grid = c.querySelector('#equipCustom');
    c.querySelectorAll('[data-loc]').forEach(op => op.addEventListener('click', () => {
      const v = op.dataset.loc;
      draft.local = v; selectOne(c, op, '.option');
      if (v === 'custom') grid.hidden = false;
      else { grid.hidden = true; draft.equipamentos = [...PRESETS[v]]; }
      setNext(true);
    }));
    c.querySelectorAll('.equip').forEach(eq => eq.addEventListener('click', () => {
      const id = eq.dataset.id;
      if ((EQUIPMENT.find(e => e.id === id) || {}).base) return;
      if (draft.equipamentos.includes(id)) draft.equipamentos = draft.equipamentos.filter(x => x !== id);
      else draft.equipamentos.push(id);
      eq.classList.toggle('selected');
    }));
    return shell(c, { canNext: !!draft.local, nextLabel: 'Criar meu plano', onNext: finish });
  }

  /* ------- 9: Boas-vindas ------- */
  function finish() {
    Store.set({ onboarded: true, user: { nome: draft.nome }, profile: { ...draft } });
    step = steps.length - 1; render();
  }
  function stepWelcome() {
    const c = document.createElement('div');
    c.className = 'welcome';
    c.innerHTML = `
      <div class="welcome-check">${Icons.svg('check')}</div>
      <h2>Tudo pronto, ${draft.nome}!</h2>
      <p>Seu plano personalizado foi criado.</p>
      <button class="btn" id="goHome" style="max-width:220px">Ir para o app</button>`;
    c.querySelector('#goHome').addEventListener('click', () => onComplete && onComplete());
    return c;
  }

  return { start };
})();
