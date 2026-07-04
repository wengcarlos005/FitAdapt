/* ==========================================================================
   FitAdapt — Navegação e botão "voltar" do sistema (PWA)
   -------------------------------------------------------------------------
   Numa PWA instalada na tela inicial, o botão voltar do celular dispara um
   `popstate`. Sem tratamento, ele fecha o app inteiro. Este módulo intercepta
   o voltar e o faz navegar DENTRO do app:

     - Overlay/painel aberto  -> fecha o overlay
     - Em uma aba (não Início) -> volta para a aba anterior
     - Na Início, sem overlays -> "pressione voltar de novo para sair"

   Como funciona: mantemos nossa própria pilha de "camadas" (overlays, abas)
   e uma ÚNICA entrada-armadilha no history. Cada pressionar de voltar gera um
   `popstate`; nós consumimos a camada do topo e recriamos a armadilha. Assim
   o history nunca cresce e não há como dessincronizar.
   ========================================================================== */

const Nav = (() => {
  const layers = [];        // pilha de camadas dismissíveis (topo no fim)
  let exitArmed = false;    // "pressione voltar de novo para sair"
  let exitTimer = null;
  let onRootBack = null;    // callback ao tentar voltar na raiz (ex.: toast)
  let started = false;

  function init(opts = {}) {
    if (started) return;
    started = true;
    onRootBack = opts.onRootBack || null;
    // Marca a entrada de lançamento e cria a armadilha no topo.
    try { history.replaceState({ fa: 'root' }, ''); } catch (_) {}
    history.pushState({ fa: 'trap' }, '');
    window.addEventListener('popstate', onPop);
  }

  /* Registra uma nova camada (overlay/painel/aba).
     closeFn desfaz a camada (remover DOM, limpar timers, etc). */
  function push(closeFn) {
    const layer = { closeFn, _closed: false };
    layers.push(layer);
    return layer; // não mexe no history — a armadilha basta
  }

  /* Fecha camada(s) por iniciativa do app (botão X, clicar fora, escolher
     opção). Roda o closeFn; o history não precisa mudar (a armadilha fica). */
  function back(layer) {
    if (!layers.length) return;
    const idx = layer ? layers.indexOf(layer) : layers.length - 1;
    if (idx === -1) return;
    // Remove essa camada e as que estiverem acima dela.
    const removed = layers.splice(idx);
    removed.reverse().forEach(runClose);
  }

  /* Remove uma camada da pilha SEM rodar o closeFn (quando o app já fez a
     transição por conta própria — ex.: treino concluído). */
  function drop(layer) {
    const idx = layers.indexOf(layer);
    if (idx !== -1) layers.splice(idx, 1);
  }

  /* Esvazia a pilha (troca de usuário / logout / novo onboarding). */
  function reset() { layers.length = 0; }

  function runClose(layer) {
    if (layer._closed) return;
    layer._closed = true;
    try { layer.closeFn && layer.closeFn(); } catch (_) {}
  }

  /* Voltar por hardware: o history saiu da armadilha p/ a raiz. */
  function onPop() {
    if (layers.length) {
      runClose(layers.pop());
      reTrap();               // recria a armadilha p/ o próximo voltar
    } else {
      handleRoot();
    }
  }

  function reTrap() {
    history.pushState({ fa: 'trap' }, '');
  }

  function handleRoot() {
    if (exitArmed) {
      // Segundo voltar dentro da janela -> deixa o app fechar de fato.
      window.removeEventListener('popstate', onPop);
      history.back();
      return;
    }
    exitArmed = true;
    reTrap();                 // fica no app
    if (onRootBack) { try { onRootBack(); } catch (_) {} }
    clearTimeout(exitTimer);
    exitTimer = setTimeout(() => { exitArmed = false; }, 2200);
  }

  return { init, push, back, drop, reset };
})();
