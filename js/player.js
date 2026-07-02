/* ==========================================================================
   FitAdapt — Player de treino (Passo 4)
   Interface do exercício: foto, demo, passo a passo, séries/reps/descanso,
   registro de carga por série, RPE, timer de descanso e conclusão.
   ========================================================================== */

const Player = (() => {
  const host = document.getElementById('app');
  const tabbar = document.getElementById('tabbar');

  let dia = null;
  let diaIdx = 0;      // índice do dia no rodízio
  let idx = 0;         // exercício atual
  let onExit = null;
  let overlay = null;
  let restInt = null;
  let fotoInt = null;
  let inicio = 0;         // timestamp de início da sessão
  let sessaoLogs = [];    // registros desta sessão (p/ resumo/volume)
  let completed = new Set(); // índices de exercícios concluídos

  function start(diaObj, diaIndex, exitCb) {
    dia = diaObj;
    diaIdx = diaIndex || 0;
    onExit = exitCb;
    const sess = Store.get().session;
    if (sess && sess.diaIdx === diaIdx) {      // retomar treino salvo
      idx = Math.min(sess.idx || 0, totalEx() - 1);
      sessaoLogs = sess.logs || [];
      completed = new Set(sess.done || []);
      inicio = sess.inicio || Date.now();
    } else {
      idx = 0; sessaoLogs = []; completed = new Set(); inicio = Date.now();
    }
    tabbar.hidden = true;
    renderEx();
  }

  // Salva o andamento para poder retomar depois
  function persistSession() {
    Store.set({ session: { diaIdx, idx, logs: sessaoLogs, done: [...completed], inicio } });
  }

  function close() {
    if (restInt) clearInterval(restInt);
    if (fotoInt) clearInterval(fotoInt);
    if (overlay) overlay.remove();
    tabbar.hidden = false;
    onExit && onExit();
  }

  function item() { return dia.exercicios[idx]; }
  function totalEx() { return dia.exercicios.length; }

  /* Mostra kg apenas quando há carga externa */
  function usaCarga(ex) {
    return ex.equip.some(e => ['halteres','barra','maquinas','polia','kettlebell'].includes(e));
  }
  /* Equipamento "principal" do exercício (o mais característico) */
  const EQ_PRIORITY = ['maquinas','polia','barra_fixa','barra','kettlebell','halteres','cardio','banco','elastico','peso_corporal'];
  function equipPrincipal(ex) {
    for (const e of EQ_PRIORITY) if (ex.equip.includes(e)) return e;
    return ex.equip[0];
  }
  function nomeEquip(id) { return (EQUIPMENT.find(e => e.id === id) || {}).nome || ''; }
  function repsBase(reps) {
    const m = String(reps).match(/\d+/);
    return m ? m[0] : '';
  }

  /* ------------------------------ Render ------------------------------ */
  function renderEx() {
    if (restInt) { clearInterval(restInt); restInt = null; }
    if (fotoInt) { clearInterval(fotoInt); fotoInt = null; }
    const it = item();
    const efId = Store.resolve(it.exId);
    const ex = Algo.byId(efId);
    const media = exMedia(efId);
    const grp = GROUPS[ex.grupo] || { cor:'#888', label:ex.grupo };
    const cor = grp.cor;
    const carga = usaCarga(ex);
    const isCardio = ex.tipo === 'cardio';
    const ultimo = idx === totalEx() - 1;

    // Sobrecarga progressiva: sugestão de carga a partir do histórico
    const plan = Store.get().plan;
    const deload = !!(plan && plan.semana && plan.semana % 4 === 0);
    const sug = (!isCardio && carga) ? Algo.sugerirCarga(efId, it, Store.get().logs, { deload }) : null;
    const kgPrefill = sug ? sug.carga : '';

    // Banner da sugestão
    let sugBanner = '';
    if (sug) {
      const map = {
        progressao: { cls:'up',   txt:`Progressão: tente <b>${sug.carga} kg</b> (+${sug.delta}) — você completou na última vez.` },
        manter:     { cls:'hold', txt:`Mantenha <b>${sug.carga} kg</b> e foque na execução.` },
        reps:       { cls:'hold', txt:`Mantenha <b>${sug.carga} kg</b> e tente somar repetições.` },
        deload:     { cls:'de',   txt:`Semana de recuperação: use <b>${sug.carga} kg</b> (carga reduzida).` },
      }[sug.motivo] || { cls:'hold', txt:`Sugestão: <b>${sug.carga} kg</b>.` };
      sugBanner = `<div class="sug-banner ${map.cls}">${Icons.svg('repeat')}<span>${map.txt}</span></div>`;
    }

    // Linhas de registro de série
    let sets = '';
    if (isCardio) {
      sets = `
        <div class="log-cardio">
          <div class="log-label">Duração alvo: <b>${ex.repsFixo}</b></div>
          <div class="field"><label>Duração realizada (min)</label>
            <input class="input" id="cardioMin" type="number" inputmode="numeric" value="${repsBase(ex.repsFixo)}"></div>
        </div>`;
    } else {
      let rows = '';
      for (let i = 1; i <= it.series; i++) {
        rows += `
          <div class="set-row" data-set="${i}">
            <div class="set-n">${i}</div>
            <div class="set-in">
              <input class="input mini reps" type="number" inputmode="numeric" value="${repsBase(it.reps)}">
              <span class="set-u">reps</span>
            </div>
            ${carga ? `<div class="set-in">
              <input class="input mini kg" type="number" inputmode="decimal" placeholder="kg" value="${kgPrefill}">
              <span class="set-u">kg</span>
            </div>` : `<div class="set-in bw">peso corporal</div>`}
            <button class="set-done" title="Concluir série">${Icons.svg('check')}</button>
          </div>`;
      }
      sets = `${sugBanner}<div class="sets">${rows}</div>`;
    }

    overlay = document.createElement('div');
    overlay.className = 'player';
    overlay.innerHTML = `
      <div class="player-head">
        <button class="p-close" id="pClose">${Icons.svg('x')}</button>
        <div class="p-progress">
          <span>Exercício ${idx + 1} de ${totalEx()}</span>
          <div class="p-bar"><span style="width:${((idx) / totalEx()) * 100}%"></span></div>
        </div>
        <button class="p-swap" id="pSwap" title="Trocar">${Icons.svg('swap')}</button>
      </div>

      <div class="player-scroll">
        <!-- Topo: equipamento usado no exercício -->
        <div class="p-hero" style="background:linear-gradient(135deg, ${hexA(cor,.9)}, ${hexA(cor,.55)})">
          <div class="p-hero-equip">${Icons.equip(equipPrincipal(ex))}</div>
          <span class="p-hero-eqname">${nomeEquip(equipPrincipal(ex))}</span>
          <span class="p-hero-grp">${grp.label}</span>
        </div>

        <h2 class="p-title">${ex.nome}</h2>

        <!-- Prescrição em pílulas -->
        ${isCardio ? `
          <div class="ex-stats cardio"><div class="stat-pill"><b>${String(ex.repsFixo).replace(/-/g,'–')}</b><span>Duração</span></div></div>
        ` : `
          <div class="ex-stats">
            <div class="stat-pill"><b>${it.series}</b><span>Séries</span></div>
            <div class="stat-pill"><b>${String(it.reps).replace(/-/g,'–')}</b><span>${ex.repsFixo?'Tempo':'Repetições'}</span></div>
            <div class="stat-pill"><b>${it.descanso}s</b><span>Descanso</span></div>
          </div>`}

        <!-- Passo a passo com a demonstração animada (gif) ao lado -->
        <div class="section-title">Como executar</div>
        ${media && media.length > 1 ? `
        <div class="p-demo-inline">
          <div class="p-demo-frame">
            <img class="p-demo-img" src="${media[0]}" alt="">
            <img class="p-demo-img p-foto-b" id="pFotoB" src="${media[1]}" alt="" aria-hidden="true">
            <span class="p-demo-tag">${Icons.svg('play')} demonstração</span>
          </div>
        </div>` : ''}
        <ol class="p-steps">
          ${ex.instr.map(s => `<li>${s}</li>`).join('')}
        </ol>

        <!-- Registro -->
        <div class="section-title">${isCardio ? 'Registro' : 'Registrar carga'}</div>
        ${sets}

        ${!isCardio ? `
        <div class="section-title">Esforço percebido (RPE)</div>
        <div class="rpe" id="rpe">
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `<button class="rpe-dot" data-rpe="${n}">${n}</button>`).join('')}
        </div>` : ''}

        <div class="rest-slot" id="restSlot"></div>
      </div>

      <div class="player-foot">
        <button class="btn" id="pNext">${ultimo ? 'Concluir treino' : 'Próximo exercício'} ${Icons.svg('chevron')}</button>
      </div>
    `;

    host.appendChild(overlay);

    // Anima a foto por crossfade de opacidade (as 2 imagens já estão no DOM).
    if (media && media.length > 1) {
      const b = overlay.querySelector('#pFotoB');
      let on = false;
      fotoInt = setInterval(() => {
        if (!b || !b.isConnected) { clearInterval(fotoInt); return; }
        on = !on;
        b.classList.toggle('show', on);
      }, 1600);
    }

    overlay.querySelector('#pClose').addEventListener('click', () => {
      persistSession();   // guarda o andamento para retomar depois
      close();
    });
    overlay.querySelector('#pSwap').addEventListener('click', () => openSwapInPlayer(it.exId));
    overlay.querySelector('#pNext').addEventListener('click', () => nextEx(ultimo));

    // Séries: ao concluir, dispara descanso
    overlay.querySelectorAll('.set-done').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.set-row');
        row.classList.toggle('done');
        if (row.classList.contains('done') && it.descanso > 0) startRest(it.descanso);
      });
    });
    // RPE
    let rpeSel = null;
    overlay.querySelectorAll('.rpe-dot').forEach(d =>
      d.addEventListener('click', () => {
        rpeSel = +d.dataset.rpe;
        overlay.querySelectorAll('.rpe-dot').forEach(x =>
          x.classList.toggle('on', +x.dataset.rpe <= rpeSel));
        overlay._rpe = rpeSel;
      }));

    overlay.querySelector('.player-scroll').scrollTop = 0;
  }

  /* ---------------------------- Timer descanso ---------------------------- */
  function startRest(seg) {
    const slot = overlay.querySelector('#restSlot');
    let restante = seg;
    if (restInt) clearInterval(restInt);
    const paint = () => {
      slot.innerHTML = `
        <div class="rest-timer">
          <div class="rest-ico">${Icons.svg('clock')}</div>
          <div class="rest-txt">Descanso <b>${restante}s</b></div>
          <button class="rest-skip" id="restSkip">Pular</button>
        </div>`;
      slot.querySelector('#restSkip').addEventListener('click', stopRest);
    };
    paint();
    restInt = setInterval(() => {
      restante--;
      if (restante <= 0) { stopRest(); return; }
      const t = slot.querySelector('.rest-txt b');
      if (t) t.textContent = restante + 's';
    }, 1000);
  }
  function stopRest() {
    if (restInt) { clearInterval(restInt); restInt = null; }
    const slot = overlay && overlay.querySelector('#restSlot');
    if (slot) slot.innerHTML = '';
  }

  /* ------------------------------ Demo modal ------------------------------ */
  function showDemo(ex, media) {
    const grp = GROUPS[ex.grupo] || { cor:'#888' };
    const m = document.createElement('div');
    m.className = 'sheet-overlay';
    m.innerHTML = `
      <div class="sheet" style="text-align:center">
        <div class="sheet-grip"></div>
        <h3 style="text-align:left">${ex.nome}</h3>
        <p class="sheet-sub" style="text-align:left">Demonstração do movimento (posição inicial → final).</p>
        <div class="demo-stage" style="background:linear-gradient(135deg,${hexA(grp.cor,.3)},${hexA(grp.cor,.06)})">
          ${media
            ? `<img class="demo-img" src="${media[0]}" alt="${ex.nome}" onerror="this.remove()">
               ${media.length > 1 ? `<img class="demo-img p-foto-b" id="demoImgB" src="${media[1]}" alt="" aria-hidden="true">` : ''}`
            : `<div class="demo-pulse" style="color:${grp.cor}">${Icons.forGroup(ex.grupo)}</div>
               <small style="display:block;margin-top:10px">Sem foto disponível para este exercício.</small>`}
        </div>
        <ol class="p-steps" style="text-align:left;margin-top:16px">
          ${ex.instr.map(s => `<li>${s}</li>`).join('')}
        </ol>
        <button class="btn secondary" id="demoClose" style="margin-top:16px">Fechar</button>
      </div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    m.querySelector('#demoClose').addEventListener('click', () => { if (demoInt) clearInterval(demoInt); m.remove(); });

    // anima as duas posições no modal por crossfade
    let demoInt = null;
    if (media && media.length > 1) {
      const b = m.querySelector('#demoImgB');
      let on = false;
      demoInt = setInterval(() => {
        if (!b || !b.isConnected) { clearInterval(demoInt); return; }
        on = !on; b.classList.toggle('show', on);
      }, 1400);
    }
    overlay.appendChild(m);
  }

  /* ------------------------- Troca dentro do player ------------------------ */
  function openSwapInPlayer(origId) {
    // Reaproveita a lógica de alternativas; ao escolher, re-renderiza o exercício
    const s = Store.get();
    const orig = Algo.byId(origId);
    const atualId = Store.resolve(origId);
    const grp = GROUPS[orig.grupo];
    const alts = Algo.alternativas(origId, s.profile);
    const lista = [orig, ...alts.filter(a => a.id !== origId)];

    const m = document.createElement('div');
    m.className = 'sheet-overlay';
    m.innerHTML = `
      <div class="sheet">
        <div class="sheet-grip"></div>
        <h3>Trocar exercício</h3>
        <p class="sheet-sub">Alternativas para <b>${grp.label}</b>. A troca fica salva.</p>
        ${lista.map(ex => {
          const isCur = ex.id === atualId, isOrig = ex.id === origId;
          const g = GROUPS[ex.grupo] || { cor:'#888' };
          const eq = ex.equip.map(e => (EQUIPMENT.find(q => q.id === e) || {}).nome).join(', ');
          return `<div class="alt ${isCur?'current':''}" data-id="${ex.id}">
            <div class="alt-ico" style="background:linear-gradient(135deg,${hexA(g.cor,.28)},${hexA(g.cor,.08)});color:${g.cor}">${Icons.forGroup(ex.grupo)}</div>
            <div class="alt-txt"><b>${ex.nome}</b><span>${eq}</span></div>
            ${isCur?'<span class="alt-flag on">atual</span>':isOrig?'<span class="alt-flag orig">original</span>':''}
          </div>`;
        }).join('')}
      </div>`;
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
    m.querySelectorAll('.alt').forEach(a => a.addEventListener('click', () => {
      const novo = a.dataset.id;
      if (novo === origId) Store.clearSub(origId); else Store.setSub(origId, novo);
      m.remove();
      overlay.remove();
      renderEx(); // re-renderiza com o exercício trocado
    }));
    overlay.appendChild(m);
  }

  /* ------------------------------ Navegação ------------------------------- */
  function nextEx(ultimo) {
    salvarRegistro();
    completed.add(idx);
    persistSession();
    if (ultimo) { finish(); return; }
    overlay.remove();
    idx++;
    renderEx();
  }

  function salvarRegistro() {
    const it = item();
    const ex = Algo.byId(Store.resolve(it.exId));
    const rec = { data: new Date().toISOString(), dia: dia.foco, exId: ex.id, nome: ex.nome, sets: [], rpe: overlay._rpe || null };
    if (ex.tipo === 'cardio') {
      const min = overlay.querySelector('#cardioMin')?.value;
      if (min) rec.sets.push({ min: +min });
    } else {
      overlay.querySelectorAll('.set-row').forEach(r => {
        const reps = r.querySelector('.reps')?.value;
        const kg = r.querySelector('.kg')?.value;
        if (reps || kg) rec.sets.push({ reps: reps ? +reps : null, carga: kg ? +kg : null });
      });
    }
    if (rec.sets.length) {
      sessaoLogs.push(rec);
      const logs = Store.get().logs.concat(rec);
      Store.set({ logs });
    }
  }

  /* Volume total da sessão (Σ reps × carga) */
  function volumeSessao() {
    let v = 0;
    sessaoLogs.forEach(r => r.sets.forEach(s => {
      if (s.reps && s.carga) v += s.reps * s.carga;
    }));
    return Math.round(v);
  }

  function finish() {
    stopRest();
    if (fotoInt) clearInterval(fotoInt);
    overlay.remove();

    const dur = Math.max(1, Math.round((Date.now() - inicio) / 60000));
    const vol = volumeSessao();
    const nExec = completed.size;
    const total = dia && Store.get().plan ? Store.get().plan.dias.length : 1;
    const proxIdx = total ? (diaIdx + 1) % total : 0;
    const proxDia = Store.get().plan.dias[proxIdx];

    let rating = null;

    overlay = document.createElement('div');
    overlay.className = 'player';
    overlay.innerHTML = `
      <div class="feedback">
        <div class="done-check">${Icons.svg('check')}</div>
        <h2>Dia concluído!</h2>
        <p class="fb-day">${dia.foco}</p>

        <div class="fb-stats">
          <div class="fb-stat"><b>${dur}</b><span>minutos</span></div>
          <div class="fb-stat"><b>${nExec}/${totalEx()}</b><span>exercícios</span></div>
          <div class="fb-stat"><b>${vol > 0 ? vol.toLocaleString('pt-BR') : '—'}</b><span>kg volume</span></div>
        </div>

        <div class="fb-rate-label">Como foi o treino?</div>
        <div class="fb-rate" id="fbRate">
          <button class="fb-opt facil" data-r="facil"><b>Fácil</b></button>
          <button class="fb-opt perfeito" data-r="perfeito"><b>Perfeito</b></button>
          <button class="fb-opt dificil" data-r="dificil"><b>Difícil</b></button>
        </div>

        <div class="fb-actions">
          <button class="btn" id="fbHome">Concluir</button>
          <button class="btn secondary" id="fbNext">Iniciar próximo: ${proxDia.foco} ${Icons.svg('chevron')}</button>
        </div>
      </div>`;
    host.appendChild(overlay);

    overlay.querySelectorAll('.fb-opt').forEach(b =>
      b.addEventListener('click', () => {
        rating = b.dataset.r;
        overlay.querySelectorAll('.fb-opt').forEach(x => x.classList.toggle('on', x === b));
      }));

    const salvar = () => {
      const s = Store.get();
      Store.set({ streak: (s.streak || 0) + 1, session: null }); // dia concluído -> limpa andamento
      Store.addFeedback({
        data: new Date().toISOString(),
        dia: dia.foco,
        dificuldade: rating,
        duracaoMin: dur,
        volume: vol,
        exercicios: nExec,
      });
      const nc = Store.advanceCursor(total); // avança o rodízio p/ o próximo dia
      if (nc === 0) { // completou um ciclo -> nova semana: regenera com exercícios variados
        const pl = Store.get().plan;
        const novaSemana = (pl.semana || 1) + 1;
        Store.set({ plan: Algo.generate(Store.get().profile, novaSemana, pl.variante || 0), substitutions: {} });
      }
    };

    overlay.querySelector('#fbNext').addEventListener('click', () => {
      salvar();
      overlay.remove();
      // inicia o próximo dia direto
      start(Store.get().plan.dias[proxIdx], proxIdx, onExit);
    });
    overlay.querySelector('#fbHome').addEventListener('click', () => {
      salvar();
      close();
    });
  }

  return { start };
})();
