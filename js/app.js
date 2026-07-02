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
  }

  function go(route) {
    current = route;
    tabbar.hidden = false;
    el.innerHTML = '';
    const view = (routes[route] || routes.home)();
    view.classList.add('fade-in');
    el.appendChild(view);
    el.scrollTop = 0;
    updateTabs();
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
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="greeting">
        <div>
          <h1>Olá, ${s.user.nome}</h1>
          <p>Objetivo: ${obj.label}</p>
        </div>
        <div class="streak-badge">${Icons.svg('flame')} ${s.streak}</div>
      </div>

      ${deload ? `<div class="deload-banner">${Icons.svg('repeat')} Semana de recuperação (deload) — cargas reduzidas para recuperar.</div>` : ''}

      <div class="hero">
        <div class="eyebrow">Treino de hoje · Semana ${semana}</div>
        <h2>${hoje.foco}</h2>
        <div class="meta"><b>${hoje.exercicios.length}</b> exercícios · <b>${hoje.tempoEstimado}</b> min</div>
        <button class="btn" id="startBtn">${Icons.svg('play')} Começar treino</button>
      </div>

      <div class="section-title">Progresso semanal</div>
      <div class="card">
        <div class="progressbar"><span style="width:0%"></span></div>
        <p style="color:var(--text-dim);font-size:13px;margin-top:10px">0 de ${p.dias} treinos concluídos nesta semana</p>
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
    wrap.querySelector('#startBtn').addEventListener('click', () =>
      startWorkout(hoje, cursor, () => go('home')));
    wrap.querySelector('#goPlan').addEventListener('click', () => go('plan'));
    return wrap;
  }

  /* ---------------------------- Ficha --------------------------- */
  function renderPlan() {
    ensurePlan();
    const s = Store.get();
    const wrap = document.createElement('div');

    let html = `
      <div class="greeting">
        <div><h1>Sua ficha</h1><p>${s.plan.split} · ${s.plan.dias.length} treinos/semana</p></div>
      </div>
    `;

    const cursor = (s.planCursor || 0) % s.plan.dias.length;
    s.plan.dias.forEach((dia, i) => {
      const proximo = i === cursor;
      html += `
        <div class="day-block ${proximo ? 'is-next' : ''}">
          <div class="day-head">
            <div>
              <span class="day-num">Dia ${i + 1}${proximo ? ' · próximo' : ''}</span>
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

    // Liga os botões de troca
    wrap.querySelectorAll('.ex-swap').forEach(btn =>
      btn.addEventListener('click', () => openSwapSheet(btn.dataset.orig)));
    // Iniciar treino a partir de um dia
    wrap.querySelectorAll('.day-start').forEach(btn =>
      btn.addEventListener('click', () => {
        const i = +btn.dataset.dia;
        startWorkout(s.plan.dias[i], i, () => go('plan'));
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

    // Fecha ao clicar fora do painel
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.remove();
    });

    // Seleção de alternativa
    overlay.querySelectorAll('.alt').forEach(altEl => {
      altEl.addEventListener('click', () => {
        const novoId = altEl.dataset.id;
        if (novoId === origId) Store.clearSub(origId); // voltou ao original
        else Store.setSub(origId, novoId);
        overlay.remove();
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
        <button class="btn" id="timeGo" style="margin-top:16px">Começar</button>
      </div>`;

    let escolha = padrao;
    overlay.querySelectorAll('.time-opt').forEach(b =>
      b.addEventListener('click', () => {
        escolha = +b.dataset.min;
        overlay.querySelectorAll('.time-opt').forEach(x => x.classList.toggle('sel', x === b));
      }));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#timeGo').addEventListener('click', () => {
      overlay.remove();
      const ajustado = Algo.ajustarTempo(dia, escolha);
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

    // Consistência: últimos 7 dias
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const diasSemana = ['D','S','T','Q','Q','S','S'];
    const treinoDatas = new Set(fbs.map(f => new Date(f.data).toDateString()));
    let dots = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje); d.setDate(d.getDate() - i);
      const done = treinoDatas.has(d.toDateString());
      dots += `<div class="cd-day ${done ? 'on' : ''}"><span>${diasSemana[d.getDay()]}</span><div class="cd-dot">${done ? Icons.svg('check') : ''}</div></div>`;
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

    wrap.innerHTML = `
      <div class="greeting"><div><h1>Progresso</h1><p>${fbs.length} treino(s) concluído(s)</p></div><div class="streak-badge">${Icons.svg('flame')} ${s.streak}</div></div>

      <div class="section-title">Consistência (7 dias)</div>
      <div class="card"><div class="cd-row">${dots}</div></div>

      <div class="section-title">Evolução por exercício</div>
      <div class="card">${cargaHTML}</div>

      <div class="section-title">Volume por treino</div>
      <div class="card">${volChart}</div>

      <div class="section-title">Conquistas</div>
      <div class="ach-grid">${achGridHTML()}</div>
    `;
    return wrap;
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
        <div class="data-row"><span class="lbl">Frequência</span><span class="val">${p.dias}x / semana</span></div>
        <div class="data-row"><span class="lbl">Tempo por treino</span><span class="val">${p.tempo} min</span></div>
      </div>

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
    tabbar.querySelectorAll('.tab').forEach(tab =>
      tab.addEventListener('click', () => go(tab.dataset.route)));
    boot();
  }

  return { init, go, boot };
})();

document.addEventListener('DOMContentLoaded', App.init);
