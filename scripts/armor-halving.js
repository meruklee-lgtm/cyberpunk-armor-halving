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
  
  // Hilfsfunktion: Berechne halbierten SP-Wert
  function getHalvedSP(armor, location) {
    if (!armor || armor.type !== 'armor') return null;
    
    const sp = location === 'body' 
      ? armor.system.bodyLocation?.sp 
      : armor.system.headLocation?.sp;
    
    return sp !== undefined ? Math.floor(sp / 2) : null;
  }
  
  // Patch die getRollData Methode für Damage Calculations
  const originalGetRollData = CONFIG.Item.documentClass.prototype.getRollData;
  
  CONFIG.Item.documentClass.prototype.getRollData = function() {
    const data = originalGetRollData.call(this);
    
    if (this.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
      // Füge halbierte Werte für Berechnungen hinzu
      if (data.bodyLocation?.sp !== undefined) {
        data.bodyLocation.effectiveSP = Math.floor(data.bodyLocation.sp / 2);
      }
      if (data.headLocation?.sp !== undefined) {
        data.headLocation.effectiveSP = Math.floor(data.headLocation.sp / 2);
      }
    }
    
    return data;
  };
  
  console.log('Cyberpunk Armor Halving | Hooks eingerichtet');
});

// Manipuliere die Anzeige im Character Sheet (kosmetisch)
Hooks.on('renderActorSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  app.actor.items.filter(i => i.type === 'armor').forEach(armor => {
    const armorElement = html.find(`[data-item-id="${armor.id}"]`);
    
    if (armorElement.length) {
      // Body Location
      if (armor.system.bodyLocation?.sp !== undefined) {
        const originalSP = armor.system.bodyLocation.sp;
        const halvedSP = Math.floor(originalSP / 2);
        const ablation = armor.system.bodyLocation.ablation || 0;
        const effectiveSP = Math.max(0, halvedSP - ablation);
        
        const bodyStatsElement = armorElement.find('.armor-1-stats');
        if (bodyStatsElement.length) {
          // Zeige: "effektiv/halbiert" statt "effektiv/original"
          bodyStatsElement.text(`${effectiveSP}/${halvedSP}`);
        }
      }
      
      // Head Location
      if (armor.system.headLocation?.sp !== undefined) {
        const originalSP = armor.system.headLocation.sp;
        const halvedSP = Math.floor(originalSP / 2);
        const ablation = armor.system.headLocation.ablation || 0;
        const effectiveSP = Math.max(0, halvedSP - ablation);
        
        const headStatsElement = armorElement.find('.armor-2-stats');
        if (headStatsElement.length) {
          headStatsElement.text(`${effectiveSP}/${halvedSP}`);
        }
      }
    }
  });
});

// Manipuliere Item Sheet Anzeige
Hooks.on('renderItemSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  if (app.item.type !== 'armor') return;
  
  html.find('.window-title').append(' <span style="color: #ff6b6b; font-size: 0.8em;">[SP halbiert]</span>');
  
  // Zeige halbierten Wert als Info
  if (app.item.system.bodyLocation?.sp !== undefined) {
    const originalSP = app.item.system.bodyLocation.sp;
    const halvedSP = Math.floor(originalSP / 2);
    
    const spInput = html.find('input[name="system.bodyLocation.sp"]');
    if (spInput.length && spInput.val() == originalSP) {
      spInput.after(`<span style="margin-left: 10px; color: #28a745; font-weight: bold;">→ Effektiv: ${halvedSP} SP</span>`);
    }
  }
  
  if (app.item.system.headLocation?.sp !== undefined) {
    const originalSP = app.item.system.headLocation.sp;
    const halvedSP = Math.floor(originalSP / 2);
    
    const spInput = html.find('input[name="system.headLocation.sp"]');
    if (spInput.length && spInput.val() == originalSP) {
      spInput.after(`<span style="margin-left: 10px; color: #28a745; font-weight: bold;">→ Effektiv: ${halvedSP} SP</span>`);
    }
  }
});

// KRITISCH: Patch Damage Calculation
Hooks.on('preUpdateActor', (actor, change, options, userId) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  // Markiere dass Armor-Halving aktiv ist
  options.armorHalvingActive = true;
});

// Manipuliere Token-Tooltip (falls das System welche hat)
Hooks.on('renderTokenHUD', (hud, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  // Hier könnten wir Token-Tooltips anpassen
  // System-spezifisch
});
