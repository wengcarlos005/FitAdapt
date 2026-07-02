/* ==========================================================================
   FitAdapt — Ícones SVG (substitui emojis)
   Estilo linha, herda a cor via currentColor.
   ========================================================================== */

/* util global: hex (#rrggbb) + alpha 0..1 -> rgba() */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const Icons = (() => {
  const S = inner =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

  const set = {
    dumbbell: S('<path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>'),
    core:     S('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10h16M4 14h16"/>'),
    cardio:   S('<path d="M3 12h4l2 6 4-13 2 7h6"/>'),
    swap:     S('<path d="M8 4 4 8l4 4"/><path d="M4 8h13a3 3 0 0 1 3 3v1"/><path d="m16 20 4-4-4-4"/><path d="M20 16H7a3 3 0 0 1-3-3v-1"/>'),
    play:     '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>',
    clock:    S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    check:    S('<path d="M20 6 9 17l-5-5"/>'),
    x:        S('<path d="M18 6 6 18M6 6l12 12"/>'),
    chevron:  S('<path d="m9 6 6 6-6 6"/>'),
    flame:    S('<path d="M12 2s4 3.5 4 8a4 4 0 0 1-8 0c0-1.5.7-2.7.7-2.7S9 8 11 8c0-2.5 1-4 1-6z"/>'),
    layers:   S('<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>'),
    repeat:   S('<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
    dumbbellSm: S('<path d="M6 7v10M4 9v6M18 7v10M20 9v6M6 12h12"/>'),
  };

  function forGroup(grupo) {
    if (grupo === 'cardio') return set.cardio;
    if (grupo === 'core') return set.core;
    return set.dumbbell;
  }

  return { svg: n => set[n] || '', forGroup };
})();
