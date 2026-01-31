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
  
  const originalPrepare = CONFIG.Item.documentClass.prototype.prepareDerivedData;
  
  CONFIG.Item.documentClass.prototype.prepareDerivedData = function() {
    originalPrepare.call(this);
    
    if (this.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
      // Hole Original-Werte aus _source (unveränderliche DB-Werte)
      const origBodySP = this._source.system.bodyLocation?.sp;
      const origHeadSP = this._source.system.headLocation?.sp;
      
      // Body Location
      if (this.system.bodyLocation?.sp !== undefined && origBodySP !== undefined) {
        const halvedSP = Math.floor(origBodySP / 2);
        this.system.bodyLocation.sp = halvedSP;
        
        // Ablation wird NICHT verändert (bleibt original)
        // Effektiver SP kann negativ sein, aber wir zeigen min. 0
      }
      
      // Head Location
      if (this.system.headLocation?.sp !== undefined && origHeadSP !== undefined) {
        const halvedSP = Math.floor(origHeadSP / 2);
        this.system.headLocation.sp = halvedSP;
      }
      
      // Shields
      if (game.settings.get('cyberpunk-armor-halving', 'halveshields')) {
        const origShieldMax = this._source.system.shieldHitPoints?.max;
        
        if (this.system.shieldHitPoints?.max !== undefined && origShieldMax !== undefined) {
          this.system.shieldHitPoints.max = Math.floor(origShieldMax / 2);
        }
      }
    }
  };
  
  console.log('Cyberpunk Armor Halving | Patch angewendet');
});

// Verhindere negative SP-Anzeige im Character Sheet
Hooks.on('renderActorSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  // Finde alle Armor-Items und korrigiere die Anzeige
  app.actor.items.filter(i => i.type === 'armor').forEach(armor => {
    const armorElement = html.find(`[data-item-id="${armor.id}"]`);
    
    if (armorElement.length) {
      // Body Location (armor-1-stats)
      if (armor.system.bodyLocation?.sp !== undefined) {
        const bodySP = armor.system.bodyLocation.sp;
        const bodyAblation = armor.system.bodyLocation.ablation || 0;
        const effectiveSP = Math.max(0, bodySP - bodyAblation);
        
        const bodyStatsElement = armorElement.find('.armor-1-stats');
        if (bodyStatsElement.length) {
          // Ersetze den Text: "X/Y" wobei X nie negativ ist
          bodyStatsElement.text(`${effectiveSP}/${bodySP}`);
        }
      }
      
      // Head Location (armor-2-stats)
      if (armor.system.headLocation?.sp !== undefined) {
        const headSP = armor.system.headLocation.sp;
        const headAblation = armor.system.headLocation.ablation || 0;
        const effectiveSP = Math.max(0, headSP - headAblation);
        
        const headStatsElement = armorElement.find('.armor-2-stats');
        if (headStatsElement.length) {
          headStatsElement.text(`${effectiveSP}/${headSP}`);
        }
      }
    }
  });
});

Hooks.on('renderItemSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  if (app.item.type !== 'armor') return;
  
  html.find('.window-title').append(' <span style="color: #ff6b6b; font-size: 0.8em;">[SP halbiert]</span>');
});
