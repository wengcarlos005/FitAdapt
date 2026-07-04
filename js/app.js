/* ==========================================================================
   FitAdapt — App shell + roteador simples
   Passo 2: entra pelo onboarding se ainda não houver perfil.
   ========================================================================== */

const App = (() => {
  const el = document.getElementById('app');
  const tabbar = document.getElementById('tabbar');
  let current = 'home';

  const OBJETIVOS = {
    perda_peso:      { label: 'Perder peso',     tag: 'loss', ico: '🔥' },
    ganho_massa:     { label: 'Ganhar massa',    tag: 'mass', ico: '💪' },
    condicionamento: { label: 'Condicionamento', tag: 'cond', ico: '⚡' },
  };
  const NIVEIS = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };

  const routes = {
    home: renderHome,
    plan: renderPlan,
    progress: renderProgress,
    profile: renderProfile,
  };

  /* Garante que exista uma ficha gerada para o perfil atual */
  function ensurePlan() {
    const s = Store.get();
    if (s.profile && !s.plan) {
      Store.set({ plan: Algo.generate(s.profile) });
    }
    // Semeia o primeiro registro de peso (baseline do gráfico)
    if (s.profile && s.profile.peso && (!s.pesos || !s.pesos.length)) {
      Store.set({ pesos: [{ data: new Date().toISOString(), peso: s.profile.peso }] });
    }
  }

  function go(route, viaPop) {
    const prev = current;
    current = route;
    tabbar.hidden = false;
    el.innerHTML = '';
    const view = (routes[route] || routes.home)();
    view.classList.add('fade-in');
    el.appendChild(view);
    el.scrollTop = 0;
    updateTabs();
    // Botão voltar do sistema: registra a aba anterior para poder retornar.
    if (!viaPop && prev && prev !== route) {
      Nav.push(() => go(prev, true));
    }
  }

  function updateTabs() {
    document.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.dataset.route === current));
  }

  /* ---------------------------- Home ---------------------------- */
  function renderHome() {
    ensurePlan();
    const s = Store.get();
    const p = s.profile;
    const obj = OBJETIVOS[p.objetivo];
    const cursor = (s.planCursor || 0) % s.plan.dias.length;
    const hoje = s.plan.dias[cursor]; // próximo treino do rodízio
    const semana = (s.plan.semana || 1);
    const deload = semana % 4 === 0;
    const feitos = treinosNaSemana();                         // treinos concluídos nesta semana
    const pct = Math.min(100, Math.round((feitos / p.dias) * 100));
    const emAndamento = s.session && s.session.diaIdx === cursor; // retomar?

    // Agenda: hoje é dia de treino? qual o próximo dia agendado?
    const agenda = p.diasSemana && p.diasSemana.length ? p.diasSemana : null;
    const dow = new Date().getDay();
    const treinaHoje = !agenda || agenda.includes(dow) || emAndamento;
    const prox = agenda ? proximoDiaTreino(agenda, dow) : null;

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="greeting">
        <div>
          <h1>${saudacao()}, ${s.user.nome}</h1>
          <p>Objetivo: ${obj.label}</p>
        </div>
        <div class="streak-badge" title="Dias de treino seguidos">${Icons.svg('flame')} ${s.streak}</div>
      </div>

      ${deload ? `<div class="deload-banner">${Icons.svg('repeat')} Semana de recuperação (deload) — cargas reduzidas para recuperar.</div>` : ''}

      ${treinaHoje ? `
      <div class="hero">
        <div class="eyebrow">${emAndamento ? 'Em andamento' : 'Treino de hoje'} · Semana ${semana}</div>
        <h2>${hoje.foco}</h2>
        <div class="meta"><b>${hoje.exercicios.length}</b> exercícios · <b>${hoje.tempoEstimado}</b> min${agenda && p.horario ? ` · ${p.horario}` : ''}</div>
        <button class="btn" id="startBtn">${Icons.svg('play')} ${emAndamento ? 'Continuar treino' : 'Começar treino'}</button>
      </div>` : `
      <div class="hero rest">
        <div class="eyebrow">Descanso · Semana ${semana}</div>
        <h2>Hoje é dia de descanso</h2>
        <div class="meta">${prox ? `Próximo treino: <b>${WEEKDAYS[prox.dow]}</b> (${prox.emDias === 1 ? 'amanhã' : 'em ' + prox.emDias + ' dias'})${p.horario ? ' · ' + p.horario : ''}` : ''}</div>
        <button class="btn" id="startBtn">${Icons.svg('play')} Treinar mesmo assim</button>
      </div>`}

      ${agenda ? `<div class="agenda-strip">${WEEKDAYS_SHORT.map((d,i)=>`<span class="ag-day ${agenda.includes(i)?'on':''} ${i===dow?'today':''}">${d}</span>`).join('')}</div>` : ''}

      <div class="section-title">Progresso semanal</div>
      <div class="card">
        <div class="progressbar"><span style="width:${pct}%"></span></div>
        <p style="color:var(--text-dim);font-size:13px;margin-top:10px">${feitos} de ${p.dias} treinos concluídos nesta semana</p>
      </div>

      <div class="section-title">Sua semana · ${s.plan.split}</div>
      <div class="card" id="goPlan" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text-dim);font-size:14px">${s.plan.dias.length} treinos montados</span>
          <span style="color:var(--brand);font-weight:700;font-size:14px">Ver ficha →</span>
        </div>
      </div>

      <div class="section-title">Resumo</div>
      <div class="stat-row">
        <div class="stat"><div class="k">Peso atual</div><div class="v">${p.peso}<small> kg</small></div></div>
        <div class="stat"><div class="k">IMC</div><div class="v">${imc(p)}</div></div>
      </div>
    `;
    wrap.querySelector('#startBtn').addEventListener('click', () => {
      if (emAndamento) Player.start(hoje, cursor, () => go('home'));   // retoma direto
      else startWorkout(hoje, cursor, () => go('home'));               // pergunta o tempo
    });
    wrap.querySelector('#goPlan').addEventListener('click', () => go('plan'));
    return wrap;
  }

  const FOCO_LABELS = { pernas:'Pernas e glúteos', bracos:'Braços', peito:'Peito', costas:'Costas', ombros:'Ombros', abdomen:'Abdômen' };
  function focoLabel(foco) {
    if (!foco || !foco.length) return 'Equilibrado';
    return foco.map(f => FOCO_LABELS[f] || f).join(', ');
  }

  const WEEKDAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const WEEKDAYS_SHORT = ['D','S','T','Q','Q','S','S'];
  function proximoDiaTreino(agenda, fromDow) {
    for (let k = 1; k <= 7; k++) {
      const d = (fromDow + k) % 7;
      if (agenda.includes(d)) return { dow: d, emDias: k };
    }
    return null;
  }

  function saudacao() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /* Nº de treinos concluídos na semana atual (segunda a domingo) */
  function treinosNaSemana() {
    const fbs = Store.get().feedbacks || [];
    const hoje = new Date();
    const dia = (hoje.getDay() + 6) % 7;            // 0 = segunda
    const inicioSemana = new Date(hoje);
    inicioSemana.setHours(0, 0, 0, 0);
    inicioSemana.setDate(inicioSemana.getDate() - dia);
    return fbs.filter(f => new Date(f.data) >= inicioSemana).length;
  }

  /* ---------------------------- Ficha --------------------------- */
  function renderPlan() {
    ensurePlan();
    const s = Store.get();
    const wrap = document.createElement('div');

    let html = `
      <div class="greeting">
        <div><h1>Sua ficha</h1><p>${s.plan.split} · Semana ${s.plan.semana || 1}</p></div>
        <button class="vary-btn" id="varyBtn" title="Gerar novos exercícios">${Icons.svg('repeat')} Variar</button>
      </div>
    `;

    const cursor = (s.planCursor || 0) % s.plan.dias.length;
    const sessIdx = s.session ? s.session.diaIdx : -1;
    s.plan.dias.forEach((dia, i) => {
      const proximo = i === cursor;
      const andamento = i === sessIdx;
      const marca = andamento ? ' · em andamento' : (proximo ? ' · próximo' : '');
      html += `
        <div class="day-block ${andamento ? 'is-active' : proximo ? 'is-next' : ''}">
          <div class="day-head">
            <div>
              <span class="day-num">Dia ${i + 1}${marca}</span>
              <div class="d-title">${dia.foco}</div>
              <div class="d-sub">${dia.exercicios.length} ex · ${dia.tempoEstimado} min</div>
            </div>
            <button class="day-start" data-dia="${i}" title="Iniciar treino">${Icons.svg('play')}</button>
          </div>
          ${dia.exercicios.map(item => exCardHTML(item)).join('')}
        </div>
      `;
    });

    wrap.innerHTML = html;

    // Variar treinos (nova seleção de exercícios)
    wrap.querySelector('#varyBtn').addEventListener('click', () => {
      if (s.session && !confirm('Você tem um treino em andamento. Gerar novos exercícios vai descartá-lo. Continuar?')) return;
      const pl = s.plan;
      Store.set({
        plan: Algo.generate(s.profile, pl.semana || 1, (pl.variante || 0) + 1),
        substitutions: {},
        session: null,
      });
      go('plan');
    });

    // Liga os botões de troca
    wrap.querySelectorAll('.ex-swap').forEach(btn =>
      btn.addEventListener('click', () => openSwapSheet(btn.dataset.orig)));
    // Iniciar/retomar treino a partir de um dia
    wrap.querySelectorAll('.day-start').forEach(btn =>
      btn.addEventListener('click', () => {
        const i = +btn.dataset.dia;
        if (i === sessIdx) Player.start(s.plan.dias[i], i, () => go('plan'));  // retomar
        else startWorkout(s.plan.dias[i], i, () => go('plan'));
      }));

    return wrap;
  }

  /* Monta o HTML de um card de exercício (aplicando substituição) */
  function exCardHTML(item) {
    const origId = item.exId;
    const efId = Store.resolve(origId);           // exercício efetivo (pode ser o substituto)
    const ex = Algo.byId(efId);
    const grp = GROUPS[ex.grupo] || { label: ex.grupo, cor: '#888' };
    const trocado = efId !== origId;

    // Bloco de séries/reps/descanso em pílulas claras
    let stats;
    if (ex.tipo === 'cardio') {
      stats = `<div class="ex-stats cardio">
        <div class="stat-pill"><b>${fmtReps(ex.repsFixo)}</b><span>Duração</span></div>
      </div>`;
    } else {
      const repsLabel = ex.repsFixo ? 'Tempo' : 'Repetições';
      stats = `<div class="ex-stats">
        <div class="stat-pill"><b>${item.series}</b><span>Séries</span></div>
        <div class="stat-pill"><b>${fmtReps(item.reps)}</b><span>${repsLabel}</span></div>
        <div class="stat-pill"><b>${item.descanso}s</b><span>Descanso</span></div>
      </div>`;
    }

    return `
      <div class="ex-card">
        <div class="ex-top">
          <div class="ex-foto" style="background:${gradiente(grp.cor)};color:${grp.cor}">
            <span class="foto-ico">${Icons.forGroup(ex.grupo)}</span>
            ${exMedia(efId) ? `<img class="foto-img" src="${exMedia(efId)[0]}" alt="" loading="lazy" onerror="this.remove()">` : ''}
          </div>
          <div class="ex-info">
            <div class="ex-nome">${ex.nome}</div>
            <span class="ex-grp" style="color:${grp.cor}">${grp.label}</span>
            ${item.foco ? `<span class="foco-badge">★ prioridade</span>` : ''}
            ${trocado ? `<span class="swapped-badge">${Icons.svg('swap')} trocado</span>` : ''}
          </div>
          <button class="ex-swap" data-orig="${origId}" title="Trocar exercício">
            ${Icons.svg('swap')}<span>Trocar</span>
          </button>
        </div>
        ${stats}
      </div>
    `;
  }

  /* "12-15" -> "12–15 reps" fica no label; aqui só troca hífen por travessão */
  function fmtReps(r) { return String(r).replace(/-/g, '–'); }
  /* fundo em gradiente suave a partir da cor do grupo */
  function gradiente(cor) { return `linear-gradient(135deg, ${hexA(cor, .28)}, ${hexA(cor, .08)})`; }

  /* Painel de troca de exercício (bottom sheet) */
  function openSwapSheet(origId) {
    const s = Store.get();
    const orig = Algo.byId(origId);
    const atualId = Store.resolve(origId);
    const grp = GROUPS[orig.grupo];

    // Alternativas + o próprio original (para poder voltar a ele)
    const alts = Algo.alternativas(origId, s.profile);
    const lista = [orig, ...alts.filter(a => a.id !== origId)];

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-grip"></div>
        <h3>Trocar exercício</h3>
        <p class="sheet-sub">Não achou o equipamento? Escolha outra opção para <b>${grp.label}</b>. A troca fica salva.</p>
        ${lista.map(ex => {
          const isCurrent = ex.id === atualId;
          const isOrig = ex.id === origId;
          const g = GROUPS[ex.grupo] || { cor:'#888', label:ex.grupo };
          const equipTxt = ex.equip.map(e => (EQUIPMENT.find(q => q.id === e) || {}).nome).join(', ');
          return `
            <div class="alt ${isCurrent ? 'current' : ''}" data-id="${ex.id}" data-orig="${origId}">
              <div class="alt-ico" style="background:${gradiente(g.cor)};color:${g.cor}">${Icons.forGroup(ex.grupo)}</div>
              <div class="alt-txt">
                <b>${ex.nome}</b>
                <span>${equipTxt}</span>
              </div>
              ${isCurrent ? `<span class="alt-flag on">atual</span>`
                : isOrig ? `<span class="alt-flag orig">original</span>` : ''}
            </div>`;
        }).join('')}
      </div>
    `;

    const layer = Nav.push(() => overlay.remove());
    // Fecha ao clicar fora do painel
    overlay.addEventListener('click', e => {
      if (e.target === overlay) Nav.back(layer);
    });

    // Seleção de alternativa
    overlay.querySelectorAll('.alt').forEach(altEl => {
      altEl.addEventListener('click', () => {
        const novoId = altEl.dataset.id;
        if (novoId === origId) Store.clearSub(origId); // voltou ao original
        else Store.setSub(origId, novoId);
        Nav.back(layer);
        go('plan'); // re-renderiza a ficha com a troca aplicada
      });
    });

    document.getElementById('app').appendChild(overlay);
  }

  /* ------------------- Ajuste de tempo (Passo 6) ---------------- */
  function startWorkout(dia, idx, exitCb) {
    const s = Store.get();
    const padrao = s.profile.tempo || 45;
    const cheio = dia.tempoEstimado;
    const opts = [15, 30, 45, 60, 90];

    // Prévia do treino ajustado ao tempo escolhido (mostra que muda de verdade)
    const previa = min => {
      const aj = Algo.ajustarTempo(dia, min, s.profile);
      const n = aj.exercicios.length;
      const dif = n - dia.exercicios.length;
      const tag = dif > 0 ? `+${dif}` : dif < 0 ? `${dif}` : '=';
      return { n, min: aj.tempoEstimado, tag };
    };

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    overlay.innerHTML = `
      <div class="sheet">
        <div class="sheet-grip"></div>
        <h3>Quanto tempo você tem hoje?</h3>
        <p class="sheet-sub">Treino completo: <b>${cheio} min</b>. Ajustamos os exercícios ao seu tempo.</p>
        <div class="time-opts">
          ${opts.map(o => {
            const lbl = o >= 60 ? `${Math.floor(o/60)}h${o%60 ? o%60 : ''}` : `${o} min`;
            return `<button class="time-opt ${o === padrao ? 'sel' : ''}" data-min="${o}">${lbl}</button>`;
          }).join('')}
        </div>
        <p class="time-preview" id="timePreview"></p>
        <button class="btn" id="timeGo" style="margin-top:16px">Começar</button>
      </div>`;

    const previewEl = overlay.querySelector('#timePreview');
    const pintaPreview = min => {
      const p = previa(min);
      previewEl.innerHTML = `Seu treino: <b>${p.n} exercícios</b> · ~${p.min} min`;
    };

    let escolha = padrao;
    pintaPreview(escolha);
    overlay.querySelectorAll('.time-opt').forEach(b =>
      b.addEventListener('click', () => {
        escolha = +b.dataset.min;
        overlay.querySelectorAll('.time-opt').forEach(x => x.classList.toggle('sel', x === b));
        pintaPreview(escolha);
      }));

    const layer = Nav.push(() => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) Nav.back(layer); });
    overlay.querySelector('#timeGo').addEventListener('click', () => {
      Nav.back(layer);  // fecha o painel de tempo
      const ajustado = Algo.ajustarTempo(dia, escolha, s.profile);
      Player.start(ajustado, idx, exitCb);
    });
    document.getElementById('app').appendChild(overlay);
  }

  /* -------------------------- Progresso ------------------------- */
  function renderProgress() {
    const s = Store.get();
    const logs = s.logs || [];
    const fbs = s.feedbacks || [];
    const wrap = document.createElement('div');

    if (!logs.length && !fbs.length) {
      wrap.innerHTML = `
        <div class="greeting"><div><h1>Progresso</h1><p>Seu histórico de treinos</p></div></div>
        <div class="placeholder" style="height:auto;padding:60px 20px">
          <div class="big">${Icons.svg('dumbbell')}</div>
          <h3>Ainda sem dados</h3>
          <p style="max-width:240px">Conclua seu primeiro treino registrando as cargas para ver sua evolução aqui.</p>
        </div>`;
      return wrap;
    }

    // Volume por sessão (últimas 8)
    const volSessoes = fbs.filter(f => f.volume > 0).slice(-8);
    const volChart = volSessoes.length
      ? barChart(volSessoes.map(f => ({ v: f.volume, l: f.dia.split(' ')[0].slice(0,3) })))
      : `<p class="mut-note">Registre cargas nos treinos para ver o volume por sessão.</p>`;

    // Evolução por exercício: carga (kg) quando há peso, senão repetições
    const porEx = {};
    logs.forEach(r => {
      const maxCarga = Math.max(0, ...r.sets.map(x => x.carga || 0));
      const maxReps = Math.max(0, ...r.sets.map(x => x.reps || 0));
      const usaKg = maxCarga > 0;
      const v = usaKg ? maxCarga : maxReps;
      if (v > 0) (porEx[r.exId] = porEx[r.exId] || { unit: usaKg ? 'kg' : 'reps', pts: [] }).pts.push(v);
    });
    const exComDados = Object.keys(porEx);
    let cargaHTML;
    if (exComDados.length) {
      cargaHTML = exComDados.map(exId => {
        const ex = Algo.byId(exId);
        const u = porEx[exId].unit;
        const serie = porEx[exId].pts.slice(-8);
        const ult = serie[serie.length - 1];
        const delta = ult - serie[0];
        return `
          <div class="prog-ex">
            <div class="prog-ex-head">
              <span>${ex ? ex.nome : exId}</span>
              <b>${ult} ${u} ${delta > 0 ? `<i class="up">▲ ${delta}</i>` : delta < 0 ? `<i class="down">▼ ${-delta}</i>` : ''}</b>
            </div>
            ${sparkline(serie)}
          </div>`;
      }).join('');
    } else {
      cargaHTML = `<p class="mut-note">Conclua um treino para ver sua evolução aqui.</p>`;
    }

    // Estatísticas gerais
    const totalVol = fbs.reduce((a, f) => a + (f.volume || 0), 0);
    const totalMin = fbs.reduce((a, f) => a + (f.duracaoMin || 0), 0);

    wrap.innerHTML = `
      <div class="greeting"><div><h1>Progresso</h1><p>${fbs.length} treino(s) concluído(s)</p></div><div class="streak-badge">${Icons.svg('flame')} ${s.streak}</div></div>

      <div class="prog-stats">
        <div class="ps"><b>${fbs.length}</b><span>Treinos</span></div>
        <div class="ps"><b>${totalMin}</b><span>Minutos</span></div>
        <div class="ps"><b>${totalVol >= 1000 ? (totalVol/1000).toFixed(1) + 't' : totalVol}</b><span>Volume</span></div>
      </div>

      <div class="section-title">Calendário</div>
      <div class="card">${calendarioMes(fbs)}</div>

      <div class="section-title">Peso corporal</div>
      <div class="card" id="pesoCard">${pesoHTML()}</div>

      <div class="section-title">Recordes pessoais</div>
      <div class="card">${recordesHTML()}</div>

      <div class="section-title">Evolução por exercício</div>
      <div class="card">${cargaHTML}</div>

      <div class="section-title">Volume por treino</div>
      <div class="card">${volChart}</div>

      <div class="section-title">Histórico</div>
      <div class="hist-list">${historicoHTML(fbs)}</div>

      <div class="section-title">Conquistas</div>
      <div class="ach-grid">${achGridHTML()}</div>
    `;
    wrap.querySelector('#addPeso').addEventListener('click', () => abrirLogPeso());
    return wrap;
  }

  /* Calendário do mês atual com dias treinados marcados */
  function calendarioMes(fbs) {
    const hoje = new Date();
    const ano = hoje.getFullYear(), mes = hoje.getMonth();
    const treinos = new Set(fbs.map(f => new Date(f.data).toDateString()));
    const primeiro = new Date(ano, mes, 1);
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const offset = primeiro.getDay(); // 0=dom
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    let cells = ['D','S','T','Q','Q','S','S'].map(d => `<span class="cal-h">${d}</span>`).join('');
    for (let i = 0; i < offset; i++) cells += `<span class="cal-c empty"></span>`;
    for (let d = 1; d <= diasNoMes; d++) {
      const dt = new Date(ano, mes, d);
      const on = treinos.has(dt.toDateString());
      const isHoje = dt.toDateString() === hoje.toDateString();
      cells += `<span class="cal-c ${on ? 'on' : ''} ${isHoje ? 'today' : ''}">${d}</span>`;
    }
    return `<div class="cal-title">${meses[mes]} ${ano}</div><div class="cal-grid">${cells}</div>`;
  }

  /* Peso corporal: valor atual + variação + mini-gráfico */
  function pesoHTML() {
    const pesos = Store.get().pesos || [];
    if (!pesos.length) {
      return `<div class="peso-empty"><span class="mut-note">Registre seu peso para acompanhar a evolução.</span>
        <button class="btn secondary" id="addPeso" style="margin-top:12px">Registrar peso</button></div>`;
    }
    const vals = pesos.map(p => p.peso);
    const atual = vals[vals.length - 1];
    const delta = +(atual - vals[0]).toFixed(1);
    return `
      <div class="peso-head">
        <div><div class="peso-val">${atual}<small> kg</small></div>
        <div class="peso-delta ${delta < 0 ? 'down' : delta > 0 ? 'up' : ''}">${delta === 0 ? 'sem variação' : (delta > 0 ? '+' : '') + delta + ' kg desde o início'}</div></div>
        <button class="btn secondary" id="addPeso" style="width:auto;padding:10px 14px">Atualizar</button>
      </div>
      ${vals.length > 1 ? sparkline(vals) : ''}`;
  }

  function abrirLogPeso() {
    const atual = (Store.get().profile || {}).peso || 70;
    const ov = document.createElement('div');
    ov.className = 'sheet-overlay';
    ov.innerHTML = `
      <div class="sheet" style="text-align:center">
        <div class="sheet-grip"></div>
        <h3 style="text-align:left">Registrar peso</h3>
        <div class="big-input" style="margin:24px 0">
          <input class="input xl" id="pesoIn" type="number" inputmode="decimal" value="${atual}"><span class="xl-unit">kg</span>
        </div>
        <button class="btn" id="pesoSave">Salvar</button>
      </div>`;
    const layer = Nav.push(() => ov.remove());
    ov.addEventListener('click', e => { if (e.target === ov) Nav.back(layer); });
    ov.querySelector('#pesoSave').addEventListener('click', () => {
      const v = parseFloat(ov.querySelector('#pesoIn').value);
      if (!(v >= 30 && v <= 300)) { alert('Peso entre 30 e 300 kg.'); return; }
      const pesos = (Store.get().pesos || []).concat({ data: new Date().toISOString(), peso: v });
      Store.set({ pesos, profile: { ...Store.get().profile, peso: v } });
      Nav.back(layer);
      toast('Peso registrado', 'ok');
      go('progress');
    });
    document.getElementById('app').appendChild(ov);
    setTimeout(() => ov.querySelector('#pesoIn').focus(), 60);
  }

  /* Recordes pessoais (melhor carga por exercício, ordenado por 1RM estimado) */
  function calcRecordes() {
    const logs = Store.get().logs || [];
    const best = {};
    logs.forEach(r => (r.sets || []).forEach(st => {
      if (st.carga) {
        const e1rm = st.carga * (1 + (st.reps || 1) / 30); // Epley
        if (!best[r.exId] || e1rm > best[r.exId].e1rm) best[r.exId] = { carga: st.carga, reps: st.reps, e1rm, nome: r.nome };
      }
    }));
    return Object.entries(best).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.e1rm - a.e1rm);
  }
  function recordesHTML() {
    const recs = calcRecordes().slice(0, 5);
    if (!recs.length) return `<p class="mut-note">Registre cargas para bater recordes. 💪</p>`.replace(' 💪', '');
    return recs.map(r => `
      <div class="rec-row">
        <div class="rec-medal">${Icons.svg('trophy')}</div>
        <div class="rec-info"><div class="rec-nome">${r.nome}</div><div class="rec-sub">${r.carga} kg × ${r.reps || 1}</div></div>
        <div class="rec-1rm">${Math.round(r.e1rm)}<small>kg 1RM</small></div>
      </div>`).join('');
  }

  /* Histórico de sessões (mais recentes primeiro) */
  function historicoHTML(fbs) {
    if (!fbs.length) return `<p class="mut-note">Seus treinos concluídos aparecem aqui.</p>`;
    const dif = { facil: 'Fácil', perfeito: 'Perfeito', dificil: 'Difícil' };
    return fbs.slice().reverse().slice(0, 12).map(f => {
      const d = new Date(f.data);
      const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      return `
        <div class="hist-item">
          <div class="hist-date"><b>${data.split(' ')[0]}</b><span>${(data.split(' ')[1] || '').replace('.', '')}</span></div>
          <div class="hist-info">
            <div class="hist-foco">${f.dia}</div>
            <div class="hist-meta">${f.duracaoMin} min${f.volume ? ' · ' + f.volume.toLocaleString('pt-BR') + ' kg' : ''}${f.dificuldade ? ' · ' + (dif[f.dificuldade] || '') : ''}</div>
          </div>
          <div class="hist-check">${Icons.svg('check')}</div>
        </div>`;
    }).join('');
  }

  /* Grade de medalhas (ganhas x bloqueadas) */
  function achGridHTML() {
    const lista = avaliarConquistas(Store.get());
    return lista.map(a => `
      <div class="ach ${a.earned ? 'on' : ''}" title="${a.desc}">
        <div class="ach-medal">${Icons.svg(a.icon)}</div>
        <div class="ach-nome">${a.nome}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>`).join('');
  }

  /* Sparkline SVG simples (linha) */
  function sparkline(vals) {
    if (vals.length < 2) return `<div class="spark-single">1ª sessão registrada</div>`;
    const w = 280, h = 46, pad = 4;
    const min = Math.min(...vals), max = Math.max(...vals);
    const rng = max - min || 1;
    const pts = vals.map((v, i) => {
      const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / rng) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = pts[pts.length - 1].split(',');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pts.join(' ')}"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="var(--brand)"/>
    </svg>`;
  }

  /* Gráfico de barras simples */
  function barChart(data) {
    const max = Math.max(...data.map(d => d.v)) || 1;
    return `<div class="barchart">${data.map(d => `
      <div class="bar-col">
        <div class="bar-wrap"><div class="bar" style="height:${Math.max(6, (d.v / max) * 100)}%"></div></div>
        <div class="bar-lbl">${d.l}</div>
      </div>`).join('')}</div>`;
  }

  /* --------------------------- Perfil --------------------------- */
  function renderProfile() {
    const s = Store.get();
    const p = s.profile;
    const obj = OBJETIVOS[p.objetivo];
    const equipNomes = p.equipamentos
      .map(id => (EQUIPMENT.find(e => e.id === id) || {}).nome)
      .filter(Boolean).join(', ');

    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="greeting"><div><h1>Perfil</h1><p>Seus dados e objetivo</p></div></div>

      <div class="card" style="margin-bottom:16px">
        <div class="data-row"><span class="lbl">Nome</span><span class="val">${s.user.nome}</span></div>
        <div class="data-row"><span class="lbl">Objetivo</span><span class="val"><span class="tag ${obj.tag}">${obj.label}</span></span></div>
        <div class="data-row"><span class="lbl">Nível</span><span class="val">${NIVEIS[p.nivel]}</span></div>
        <div class="data-row"><span class="lbl">Prioridade</span><span class="val">${focoLabel(p.foco)}</span></div>
      </div>

      <div class="section-title">Dados corporais</div>
      <div class="card" style="margin-bottom:16px">
        <div class="data-row"><span class="lbl">Idade</span><span class="val">${p.idade} anos</span></div>
        <div class="data-row"><span class="lbl">Peso</span><span class="val">${p.peso} kg</span></div>
        <div class="data-row"><span class="lbl">Altura</span><span class="val">${p.altura} cm</span></div>
        <div class="data-row"><span class="lbl">IMC</span><span class="val">${imc(p)} — ${imcClasse(p)}</span></div>
      </div>

      <div class="section-title">Rotina</div>
      <div class="card" style="margin-bottom:16px">
        <div class="data-row"><span class="lbl">Dias</span><span class="val">${diasLabel(p)}</span></div>
        <div class="data-row"><span class="lbl">Horário</span><span class="val">${p.horario || '—'}</span></div>
        <div class="data-row"><span class="lbl">Tempo por treino</span><span class="val">${p.tempo} min</span></div>
      </div>

      <button class="btn secondary" id="editBtn" style="margin-bottom:22px">${Icons.svg('sliders')} Editar preferências</button>

      <div class="section-title">Equipamentos</div>
      <div class="card" style="margin-bottom:16px">
        <p style="color:var(--text-dim);font-size:14px;line-height:1.5">${equipNomes}</p>
      </div>

      <div class="profile-account">
        <div class="pa-info">
          <div class="pa-avatar">${Icons.svg('person')}</div>
          <div><div class="pa-name">${Auth.currentName() || s.user.nome}</div><div class="pa-mail">${Auth.currentUser() || ''}</div></div>
        </div>
      </div>
      <button class="btn secondary" id="resetBtn">Refazer onboarding</button>
      <button class="btn ghost" id="logoutBtn" style="margin-top:10px">Sair da conta</button>
    `;
    wrap.querySelector('#editBtn').addEventListener('click', openPrefs);
    wrap.querySelector('#resetBtn').addEventListener('click', () => {
      if (confirm('Isso apaga seu perfil e recomeça o onboarding. Continuar?')) {
        Store.reset();
        afterLogin();
      }
    });
    wrap.querySelector('#logoutBtn').addEventListener('click', () => {
      Auth.logout();
      boot();
    });
    return wrap;
  }

  function diasLabel(p) {
    if (p.diasSemana && p.diasSemana.length)
      return p.diasSemana.map(i => WEEKDAYS_SHORT[i]).join(' · ') + ` (${p.diasSemana.length}x)`;
    return `${p.dias}x / semana`;
  }

  /* Editar preferências sem refazer o onboarding */
  function openPrefs() {
    const s = Store.get(); const p = s.profile;
    const objetivos = [
      { v:'perda_peso', t:'Perder peso' }, { v:'ganho_massa', t:'Ganhar massa' }, { v:'condicionamento', t:'Condicionar' },
    ];
    const areas = [
      { v:'pernas', t:'Pernas e glúteos' }, { v:'bracos', t:'Braços' }, { v:'peito', t:'Peito' },
      { v:'costas', t:'Costas' }, { v:'ombros', t:'Ombros' }, { v:'abdomen', t:'Abdômen' },
    ];
    const d = {
      objetivo: p.objetivo, foco: [...(p.foco || [])],
      diasSemana: [...(p.diasSemana || [])], horario: p.horario || '18:00', tempo: p.tempo,
    };

    const ov = document.createElement('div');
    ov.className = 'player';
    ov.innerHTML = `
      <div class="player-head">
        <button class="p-close" id="prefClose">${Icons.svg('x')}</button>
        <div class="p-progress"><span>Editar preferências</span></div>
      </div>
      <div class="player-scroll">
        <div class="section-title">Objetivo</div>
        <div class="chips">${objetivos.map(o => `<div class="chip big ${d.objetivo===o.v?'selected':''}" data-obj="${o.v}">${o.t}</div>`).join('')}</div>

        <div class="section-title">Prioridade (volume extra)</div>
        <div class="chips">${areas.map(a => `<div class="chip big ${d.foco.includes(a.v)?'selected':''}" data-foco="${a.v}">${a.t}</div>`).join('')}</div>

        <div class="section-title">Dias que você treina</div>
        <div class="week-picker">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((w,i)=>`<div class="wd ${d.diasSemana.includes(i)?'selected':''}" data-wd="${i}">${w}</div>`).join('')}</div>

        <div class="section-title">Horário</div>
        <input class="input" id="prefHora" type="time" value="${d.horario}">

        <div class="section-title">Tempo por treino</div>
        <div class="chips">${[30,45,60,90].map(v=>`<div class="chip big ${d.tempo===v?'selected':''}" data-tempo="${v}">${v>=60?(v/60)+'h'+(v%60||''):v+' min'}</div>`).join('')}</div>
      </div>
      <div class="player-foot"><button class="btn" id="prefSave">Salvar</button></div>`;
    document.getElementById('app').appendChild(ov);

    const one = (sel, attr, cb) => ov.querySelectorAll(sel).forEach(el => el.addEventListener('click', () => {
      cb(el); ov.querySelectorAll(sel).forEach(x => x.classList.toggle('selected', x === el));
    }));
    one('[data-obj]', 'obj', el => d.objetivo = el.dataset.obj);
    one('[data-tempo]', 'tempo', el => d.tempo = +el.dataset.tempo);
    ov.querySelectorAll('[data-foco]').forEach(el => el.addEventListener('click', () => {
      const v = el.dataset.foco;
      if (d.foco.includes(v)) d.foco = d.foco.filter(x => x !== v); else d.foco.push(v);
      el.classList.toggle('selected');
    }));
    ov.querySelectorAll('[data-wd]').forEach(el => el.addEventListener('click', () => {
      const i = +el.dataset.wd;
      if (d.diasSemana.includes(i)) d.diasSemana = d.diasSemana.filter(x => x !== i);
      else d.diasSemana = [...d.diasSemana, i].sort((a, b) => a - b);
      el.classList.toggle('selected');
    }));
    ov.querySelector('#prefHora').addEventListener('input', e => d.horario = e.target.value);
    const layer = Nav.push(() => ov.remove());
    ov.querySelector('#prefClose').addEventListener('click', () => Nav.back(layer));
    ov.querySelector('#prefSave').addEventListener('click', () => {
      if (d.diasSemana.length < 2) { alert('Escolha pelo menos 2 dias de treino.'); return; }
      const novo = { ...p, objetivo: d.objetivo, foco: d.foco, diasSemana: d.diasSemana, dias: d.diasSemana.length, horario: d.horario, tempo: d.tempo };
      const estruturalMudou =
        d.objetivo !== p.objetivo ||
        d.foco.slice().sort().join() !== (p.foco || []).slice().sort().join() ||
        d.diasSemana.length !== (p.dias || (p.diasSemana || []).length);
      const patch = { profile: novo };
      if (estruturalMudou) {
        const pl = s.plan;
        patch.plan = Algo.generate(novo, pl.semana || 1, pl.variante || 0);
        patch.substitutions = {};
        patch.session = null;
        patch.planCursor = 0;
      }
      Store.set(patch);
      Nav.back(layer);
      go('profile');
    });
  }

  /* --------------------------- Utils ---------------------------- */
  function imc(p) {
    const h = p.altura / 100;
    return (p.peso / (h * h)).toFixed(1);
  }
  function imcClasse(p) {
    const v = parseFloat(imc(p));
    if (v < 18.5) return 'abaixo';
    if (v < 25) return 'normal';
    if (v < 30) return 'sobrepeso';
    return 'obesidade';
  }
  // hex (#rrggbb) + alpha 0..1 -> rgba()
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function placeholder(ico, title, msg) {
    const d = document.createElement('div');
    d.className = 'placeholder';
    d.innerHTML = `<div class="big">${ico}</div><h3>${title}</h3><p style="max-width:240px">${msg}</p>`;
    return d;
  }

  /* --------------------------- Bootstrap -------------------------- */
  function boot() {
    Nav.reset();                 // limpa camadas de navegação (troca de conta)
    tabbar.hidden = true;
    if (!Auth.session()) {
      Auth.start(afterLogin);          // não logado -> tela de login/cadastro
    } else {
      afterLogin();
    }
  }

  function afterLogin() {
    Store.setUser(Auth.session());     // carrega o progresso do usuário
    if (!Store.get().onboarded) {
      tabbar.hidden = true;
      Onboarding.start(() => { ensurePlan(); go('home'); });
    } else {
      ensurePlan();
      go('home');
    }
  }

  function init() {
    // Faz o botão voltar do celular navegar dentro do app (PWA).
    Nav.init({ onRootBack: () => toast('Pressione voltar de novo para sair') });
    tabbar.querySelectorAll('.tab').forEach(tab =>
      tab.addEventListener('click', () => go(tab.dataset.route)));
    boot();
  }

  /* Aviso flutuante (toast) — feedback rápido de UX */
  function toast(msg, tipo = 'info') {
    const shell = document.querySelector('.app-shell');
    const ic = tipo === 'pr' ? Icons.svg('trophy') : tipo === 'ok' ? Icons.svg('check') : Icons.svg('flame');
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.innerHTML = `<span class="toast-ico">${ic}</span><span>${msg}</span>`;
    shell.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 320); }, tipo === 'pr' ? 3400 : 2400);
  }

  return { init, go, boot, toast };
})();

document.addEventListener('DOMContentLoaded', App.init);
