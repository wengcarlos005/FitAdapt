/* ==========================================================================
   FitAdapt — Autenticação (contas locais + botão Google)
   Guarda contas em fitadapt.accounts e a sessão em fitadapt.session.
   O progresso de cada usuário fica isolado no Store (por e-mail).
   Obs.: login Google aqui é local (sem backend). Para Google real, integrar
   Firebase/Google Identity com um Client ID — a estrutura já suporta.
   ========================================================================== */

const Auth = (() => {
  const ACC = 'fitadapt.accounts';
  const SESS = 'fitadapt.session';
  const el = document.getElementById('app');

  const accounts = () => { try { return JSON.parse(localStorage.getItem(ACC)) || {}; } catch { return {}; } };
  const saveAccounts = a => localStorage.setItem(ACC, JSON.stringify(a));
  const session = () => localStorage.getItem(SESS) || null;
  const setSession = e => localStorage.setItem(SESS, e);
  const logout = () => localStorage.removeItem(SESS);

  // hash simples (suficiente para uma app local — não é segurança forte)
  function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
  const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  function currentName() { const a = accounts(); const s = session(); return s && a[s] ? a[s].name : ''; }

  function register(name, email, pass) {
    email = email.trim().toLowerCase();
    const a = accounts();
    if (a[email]) return 'Este e-mail já tem conta. Faça login.';
    a[email] = { name: name.trim(), pass: hash(pass), provider: 'email' };
    saveAccounts(a); setSession(email); return null;
  }
  function login(email, pass) {
    email = email.trim().toLowerCase();
    const a = accounts(); const u = a[email];
    if (!u) return 'Conta não encontrada.';
    if (u.pass !== hash(pass)) return 'Senha incorreta.';
    setSession(email); return null;
  }
  function google() {
    // Modo local: cria/usa uma conta Google única por navegador
    let gid = localStorage.getItem('fitadapt.gid');
    if (!gid) { gid = 'google_' + Math.random().toString(36).slice(2, 8) + '@gmail.com'; localStorage.setItem('fitadapt.gid', gid); }
    const a = accounts();
    if (!a[gid]) a[gid] = { name: 'Atleta', pass: '', provider: 'google' };
    saveAccounts(a); setSession(gid);
  }

  /* ------------------------------ Telas ------------------------------ */
  let onDone = null;
  let modo = 'login'; // 'login' | 'signup'

  function start(cb) { onDone = cb; render(); }

  function render() {
    el.innerHTML = '';
    const v = document.createElement('div');
    v.className = 'auth fade-in';
    v.innerHTML = `
      <div class="auth-brand">
        <div class="auth-logo">${Icons.svg('dumbbell')}</div>
        <h1>FitAdapt</h1>
        <p>Treino personalizado que evolui com você.</p>
      </div>

      <button class="btn google-btn" id="gBtn">
        <span class="g-ico">${gLogo()}</span> Continuar com Google
      </button>

      <div class="auth-sep"><span>ou ${modo === 'login' ? 'entre com e-mail' : 'crie sua conta'}</span></div>

      <div class="auth-form">
        ${modo === 'signup' ? `
        <div class="field"><label>Nome</label>
          <input class="input" id="aNome" placeholder="Seu nome" autocomplete="name"></div>` : ''}
        <div class="field"><label>E-mail</label>
          <input class="input" id="aEmail" type="email" placeholder="voce@email.com" autocomplete="email"></div>
        <div class="field"><label>Senha</label>
          <input class="input" id="aPass" type="password" placeholder="••••••••" autocomplete="${modo === 'signup' ? 'new-password' : 'current-password'}"></div>
        <p class="auth-err" id="aErr" hidden></p>
        <button class="btn" id="aGo">${modo === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </div>

      <p class="auth-toggle">
        ${modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
        <a id="aToggle">${modo === 'login' ? 'Cadastre-se' : 'Entrar'}</a>
      </p>
      <p class="auth-note">Seu progresso fica salvo na sua conta neste dispositivo.</p>
    `;
    el.appendChild(v);

    v.querySelector('#gBtn').addEventListener('click', () => { google(); done(); });
    v.querySelector('#aToggle').addEventListener('click', () => { modo = modo === 'login' ? 'signup' : 'login'; render(); });
    v.querySelector('#aGo').addEventListener('click', submit);
    v.querySelectorAll('input').forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));
  }

  function submit() {
    const err = el.querySelector('#aErr');
    const show = m => { err.textContent = m; err.hidden = false; };
    const email = el.querySelector('#aEmail').value;
    const pass = el.querySelector('#aPass').value;
    if (!emailOk(email)) return show('Digite um e-mail válido.');
    if (pass.length < 4) return show('A senha precisa de ao menos 4 caracteres.');
    let msg;
    if (modo === 'signup') {
      const nome = el.querySelector('#aNome').value;
      if (!nome.trim()) return show('Digite seu nome.');
      msg = register(nome, email, pass);
    } else {
      msg = login(email, pass);
    }
    if (msg) return show(msg);
    done();
  }

  function done() { onDone && onDone(); }

  function gLogo() {
    return `<svg viewBox="0 0 48 48" width="18" height="18"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.1 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.4c-.3 2.1-1.6 5.2-4.6 7.3l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5z"/><path fill="#FBBC05" d="M10.3 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.6 2.3-7.9 2.3-6.4 0-11.8-3.7-13.7-9.4l-7.8 6.1C6.4 42.6 14.6 48 24 48z"/></svg>`;
  }

  return { start, session, logout, currentName, currentUser: session };
})();
