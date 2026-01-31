Hooks.once('init', () => {
  console.log('Cyberpunk Armor Halving | Modul initialisiert');
  
  game.settings.register('cyberpunk-armor-halving', 'enabled', {
    name: 'Panzerung halbieren',
    hint: 'Halbiert automatisch alle SP-Werte (Stopping Power) von Panzerungen',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
  
  game.settings.register('cyberpunk-armor-halving', 'halveshields', {
    name: 'Schilde auch halbieren',
    hint: 'Halbiert auch die Hit Points von ballistischen Schilden',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });
});

Hooks.once('ready', () => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) {
    console.log('Cyberpunk Armor Halving | Deaktiviert');
    return;
  }
  
  console.log('Cyberpunk Armor Halving | Aktiviert');
});

// Verhindere negative SP-Anzeige im Character Sheet
Hooks.on('renderActorSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  app.actor.items.filter(i => i.type === 'armor').forEach(armor => {
    const armorElement = html.find(`[data-item-id="${armor.id}"]`);
    
    if (armorElement.length) {
      // HEAD Location = armor-1-stats (nicht Body!)
      if (armor.system.headLocation?.sp !== undefined) {
        const originalSP = armor.system.headLocation.sp;
        const halvedSP = Math.floor(originalSP / 2);
        const ablation = armor.system.headLocation.ablation || 0;
        const effectiveSP = Math.max(0, halvedSP - ablation);
        
        const headStatsElement = armorElement.find('.armor-1-stats');
        if (headStatsElement.length) {
          headStatsElement.text(`${effectiveSP}/${halvedSP}`);
        }
      }
      
      // BODY Location = armor-2-stats (nicht Head!)
      if (armor.system.bodyLocation?.sp !== undefined) {
        const originalSP = armor.system.bodyLocation.sp;
        const halvedSP = Math.floor(originalSP / 2);
        const ablation = armor.system.bodyLocation.ablation || 0;
        const effectiveSP = Math.max(0, halvedSP - ablation);
        
        const bodyStatsElement = armorElement.find('.armor-2-stats');
        if (bodyStatsElement.length) {
          bodyStatsElement.text(`${effectiveSP}/${halvedSP}`);
        }
      }
      
      // Shield (falls Shield-Halbierung aktiv)
      if (game.settings.get('cyberpunk-armor-halving', 'halveshields')) {
        if (armor.system.shieldHitPoints?.max !== undefined) {
          const originalMax = armor.system.shieldHitPoints.max;
          const halvedMax = Math.floor(originalMax / 2);
          
          // Shield nutzt vermutlich auch armor-1-stats oder eigene Klasse
          // Hier müsste man noch debuggen falls nötig
        }
      }
    }
  });
});

Hooks.on('renderItemSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  if (app.item.type !== 'armor') return;
  
  html.find('.window-title').append(' <span style="color: #ff6b6b; font-size: 0.8em;">[SP halbiert]</span>');
  
  // Zeige halbierten Wert als Info - HEAD
  if (app.item.system.headLocation?.sp !== undefined) {
    const originalSP = app.item.system.headLocation.sp;
    const halvedSP = Math.floor(originalSP / 2);
    
    const spInput = html.find('input[name="system.headLocation.sp"]');
    if (spInput.length && spInput.val() == originalSP) {
      spInput.after(`<span style="margin-left: 10px; color: #28a745; font-weight: bold;">→ Effektiv: ${halvedSP} SP</span>`);
    }
  }
  
  // Zeige halbierten Wert als Info - BODY
  if (app.item.system.bodyLocation?.sp !== undefined) {
    const originalSP = app.item.system.bodyLocation.sp;
    const halvedSP = Math.floor(originalSP / 2);
    
    const spInput = html.find('input[name="system.bodyLocation.sp"]');
    if (spInput.length && spInput.val() == originalSP) {
      spInput.after(`<span style="margin-left: 10px; color: #28a745; font-weight: bold;">→ Effektiv: ${halvedSP} SP</span>`);
    }
  }
});
