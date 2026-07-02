/* ==========================================================================
   FitAdapt — Onboarding
   Uma pergunta por tela. Seleção atualiza o DOM em foco (sem re-render),
   evitando qualquer "piscar". Ícones SVG (sem emoji).
   ========================================================================== */

const Onboarding = (() => {
  const el = document.getElementById('app');
  let step = 0;
  let onComplete = null;

  let draft = {
    nome: '', sexo: '', idade: null, peso: null, altura: null,
    objetivo: '', nivel: '', dias: null, tempo: null,
    local: '', equipamentos: ['peso_corporal'],
  };

  const PRESETS = {
    academia: ['peso_corporal','halteres','barra','maquinas','polia','kettlebell','banco','barra_fixa','cardio'],
    casa:     ['peso_corporal','halteres','elastico','banco'],
    livre:    ['peso_corporal'],
  };

  const steps = [stepObjetivo, stepDados, stepNivel, stepRotina, stepLocal, stepWelcome];

  function start(cb) { onComplete = cb; step = 0; render(); }
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
    const dots = steps.slice(0, 5).map((_, i) =>
      `<div class="dot ${i <= step ? 'done' : ''}"></div>`).join('');
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
  // seleção única entre .option / .chip de um grupo, sem re-render
  function selectOne(container, clicked, groupSel) {
    container.querySelectorAll(groupSel).forEach(x => x.classList.toggle('selected', x === clicked));
  }

  /* ---------------------- 0: Objetivo ---------------------- */
  function stepObjetivo() {
    const opts = [
      { v:'perda_peso',      ic:'flame',    t:'Perder peso',     d:'Queimar gordura e definir' },
      { v:'ganho_massa',     ic:'dumbbell', t:'Ganhar massa',    d:'Hipertrofia e força' },
      { v:'condicionamento', ic:'cardio',   t:'Condicionamento', d:'Resistência e saúde' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Qual é o seu objetivo?</div>
      <div class="onb-sub">Define a estrutura do seu treino.</div>
      <div class="option-list">
        ${opts.map(o => `
          <div class="option ${draft.objetivo === o.v ? 'selected' : ''}" data-v="${o.v}">
            <div class="ico">${Icons.svg(o.ic)}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">${Icons.svg('check')}</div>
          </div>`).join('')}
      </div>`;
    c.querySelectorAll('.option').forEach(op => op.addEventListener('click', () => {
      draft.objetivo = op.dataset.v; selectOne(c, op, '.option'); setNext(true);
    }));
    return shell(c, { canNext: !!draft.objetivo });
  }

  /* ---------------------- 1: Dados ---------------------- */
  function stepDados() {
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Sobre você</div>
      <div class="onb-sub">Para calcular cargas e progressão.</div>
      <div class="field">
        <label>Como podemos te chamar?</label>
        <input class="input" id="fNome" placeholder="Seu nome" value="${draft.nome}" />
      </div>
      <div class="field">
        <label>Sexo biológico</label>
        <div class="chips">
          <div class="chip ${draft.sexo==='masculino'?'selected':''}" data-sexo="masculino">Masculino</div>
          <div class="chip ${draft.sexo==='feminino'?'selected':''}" data-sexo="feminino">Feminino</div>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Idade</label>
          <div class="suffix-wrap"><input class="input" id="fIdade" type="number" inputmode="numeric" placeholder="30" value="${draft.idade ?? ''}" /><span class="suffix">anos</span></div>
        </div>
        <div class="field"><label>Peso</label>
          <div class="suffix-wrap"><input class="input" id="fPeso" type="number" inputmode="decimal" placeholder="78" value="${draft.peso ?? ''}" /><span class="suffix">kg</span></div>
        </div>
      </div>
      <div class="field"><label>Altura</label>
        <div class="suffix-wrap"><input class="input" id="fAltura" type="number" inputmode="numeric" placeholder="175" value="${draft.altura ?? ''}" /><span class="suffix">cm</span></div>
      </div>`;
    const valid = () => draft.nome && draft.sexo && draft.idade && draft.peso && draft.altura;
    const bind = (id, key, num) => {
      const inp = c.querySelector(id);
      inp.addEventListener('input', () => { draft[key] = num ? (parseFloat(inp.value) || null) : inp.value.trim(); setNext(valid()); });
    };
    bind('#fNome','nome',false); bind('#fIdade','idade',true); bind('#fPeso','peso',true); bind('#fAltura','altura',true);
    c.querySelectorAll('[data-sexo]').forEach(ch => ch.addEventListener('click', () => {
      draft.sexo = ch.dataset.sexo; selectOne(c, ch, '[data-sexo]'); setNext(valid());
    }));
    return shell(c, { canNext: valid() });
  }

  /* ---------------------- 2: Nível ---------------------- */
  function stepNivel() {
    const opts = [
      { v:'iniciante',     ic:'sprout',  t:'Iniciante',     d:'Pouca ou nenhuma experiência' },
      { v:'intermediario', ic:'dumbbell',t:'Intermediário', d:'Treina há alguns meses' },
      { v:'avancado',      ic:'trophy',  t:'Avançado',      d:'Treina há mais de 1 ano' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Seu nível</div>
      <div class="onb-sub">Ajustamos volume e dificuldade.</div>
      <div class="option-list">
        ${opts.map(o => `
          <div class="option ${draft.nivel===o.v?'selected':''}" data-v="${o.v}">
            <div class="ico">${Icons.svg(o.ic)}</div>
            <div class="txt"><b>${o.t}</b><span>${o.d}</span></div>
            <div class="check">${Icons.svg('check')}</div>
          </div>`).join('')}
      </div>`;
    c.querySelectorAll('.option').forEach(op => op.addEventListener('click', () => {
      draft.nivel = op.dataset.v; selectOne(c, op, '.option'); setNext(true);
    }));
    return shell(c, { canNext: !!draft.nivel });
  }

  /* ---------------------- 3: Rotina ---------------------- */
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

  /* ---------------------- 4: Local + equipamentos ---------------------- */
  function stepLocal() {
    const locais = [
      { v:'academia', ic:'building', t:'Academia',      d:'Acesso a máquinas e pesos livres' },
      { v:'casa',     ic:'home',     t:'Em casa',       d:'Halteres, elásticos e banco' },
      { v:'livre',    ic:'person',   t:'Só peso corporal', d:'Sem equipamento' },
      { v:'custom',   ic:'sliders',  t:'Personalizar',  d:'Escolher o que tenho' },
    ];
    const c = document.createElement('div');
    c.innerHTML = `
      <div class="onb-q">Onde você treina?</div>
      <div class="onb-sub">Só sugerimos exercícios que você consegue fazer.</div>
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
      draft.local = v;
      selectOne(c, op, '.option');
      if (v === 'custom') {
        grid.hidden = false;
      } else {
        grid.hidden = true;
        draft.equipamentos = [...PRESETS[v]];
      }
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

  /* ---------------------- 5: Boas-vindas ---------------------- */
  function finish() {
    Store.set({ onboarded: true, user: { nome: draft.nome }, profile: { ...draft } });
    step = 5; render();
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
