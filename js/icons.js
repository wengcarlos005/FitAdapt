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

    // objetivos / níveis
    target:   S('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    sprout:   S('<path d="M12 22v-9"/><path d="M12 13C12 9 9 7 4 7c0 4 3 6 8 6z"/><path d="M12 15c0-3 3-5 8-5 0 3-3 5-8 5z"/>'),
    trophy:   S('<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/>'),
    // locais
    building: S('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h6v6"/>'),
    home:     S('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-5h5v5"/>'),
    sliders:  S('<path d="M4 21v-6M4 11V3M12 21v-8M12 9V3M20 21v-4M20 13V3M2 15h4M10 9h4M18 17h4"/>'),
    // equipamentos
    person:   S('<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 9l-4 2M12 9l4 2M8.5 21l3.5-8 3.5 8"/>'),
    barbell:  S('<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>'),
    gear:     S('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M18.5 5.5l-2 2M7.5 16.5l-2 2"/>'),
    hook:     S('<path d="M12 4v6a4 4 0 1 1-4 4"/><circle cx="12" cy="4" r="1.2"/>'),
    bell:     S('<path d="M9.5 8a2.5 2.5 0 1 1 5 0c0 1-.7 1.7-.7 2.5h-3.6C10.2 9.7 9.5 9 9.5 8z"/><path d="M8 10.5c-1.2 1.8-2 3.7-2 5.5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3c0-1.8-.8-3.7-2-5.5z"/>'),
    band:     S('<path d="M4 12c2-4 6-4 8 0s6 4 8 0"/><circle cx="4" cy="12" r="1.4"/><circle cx="20" cy="12" r="1.4"/>'),
    bench:    S('<path d="M3 10h18v3H3z"/><path d="M6 13v6M18 13v6"/>'),
    pullbar:  S('<path d="M3 4h18M6 4v4M18 4v4M9.5 8a2.5 2.5 0 0 0 5 0"/>'),
    run:      S('<circle cx="14" cy="5" r="2"/><path d="M14 8l-2.5 4 3 2 1 5M11.5 12L7 13M14.5 14l3 1"/>'),
  };

  const EQUIP_ICO = {
    peso_corporal:'person', halteres:'dumbbell', barra:'barbell', maquinas:'gear',
    polia:'hook', kettlebell:'bell', elastico:'band', banco:'bench', barra_fixa:'pullbar', cardio:'run',
  };

  function forGroup(grupo) {
    if (grupo === 'cardio') return set.cardio;
    if (grupo === 'core') return set.core;
    return set.dumbbell;
  }
  function equip(id) { return set[EQUIP_ICO[id]] || set.dumbbell; }

  return { svg: n => set[n] || '', forGroup, equip };
})();
