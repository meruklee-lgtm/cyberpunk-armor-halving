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
  
  // Speichere Original-Werte für alle existierenden Armor-Items
  game.actors.forEach(actor => {
    actor.items.filter(i => i.type === 'armor').forEach(async armor => {
      if (!armor.getFlag('cyberpunk-armor-halving', 'originalBodySP')) {
        // Speichere Original-Werte als Flag (wird nur einmal gesetzt)
        await armor.setFlag('cyberpunk-armor-halving', 'originalBodySP', armor.system.bodyLocation?.sp);
        await armor.setFlag('cyberpunk-armor-halving', 'originalHeadSP', armor.system.headLocation?.sp);
        await armor.setFlag('cyberpunk-armor-halving', 'originalShieldMax', armor.system.shieldHitPoints?.max);
        console.log(`Cyberpunk Armor Halving | Original-Werte gespeichert für: ${armor.name}`);
      }
    });
  });
  
  const originalPrepare = CONFIG.Item.documentClass.prototype.prepareDerivedData;
  
  CONFIG.Item.documentClass.prototype.prepareDerivedData = function() {
    originalPrepare.call(this);
    
    if (this.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
      // Hole Original-Werte aus Flags (werden nur einmal gesetzt, nie geändert)
      const origBodySP = this.getFlag('cyberpunk-armor-halving', 'originalBodySP');
      const origHeadSP = this.getFlag('cyberpunk-armor-halving', 'originalHeadSP');
      const origShieldMax = this.getFlag('cyberpunk-armor-halving', 'originalShieldMax');
      
      // Body Location
      if (this.system.bodyLocation?.sp !== undefined && origBodySP !== undefined) {
        this.system.bodyLocation.sp = Math.floor(origBodySP / 2);
      }
      
      // Head Location
      if (this.system.headLocation?.sp !== undefined && origHeadSP !== undefined) {
        this.system.headLocation.sp = Math.floor(origHeadSP / 2);
      }
      
      // Shields
      if (game.settings.get('cyberpunk-armor-halving', 'halveshields')) {
        if (this.system.shieldHitPoints?.max !== undefined && origShieldMax !== undefined) {
          this.system.shieldHitPoints.max = Math.floor(origShieldMax / 2);
        }
      }
    }
  };
  
  console.log('Cyberpunk Armor Halving | Patch angewendet');
});

// Speichere Original-Werte für neue Armor-Items
Hooks.on('createItem', async (item, options, userId) => {
  if (item.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
    if (!item.getFlag('cyberpunk-armor-halving', 'originalBodySP')) {
      await item.setFlag('cyberpunk-armor-halving', 'originalBodySP', item.system.bodyLocation?.sp);
      await item.setFlag('cyberpunk-armor-halving', 'originalHeadSP', item.system.headLocation?.sp);
      await item.setFlag('cyberpunk-armor-halving', 'originalShieldMax', item.system.shieldHitPoints?.max);
      console.log(`Cyberpunk Armor Halving | Original-Werte gespeichert für neues Item: ${item.name}`);
    }
  }
});

// Verhindere negative SP-Anzeige im Character Sheet
Hooks.on('renderActorSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  
  app.actor.items.filter(i => i.type === 'armor').forEach(armor => {
    const armorElement = html.find(`[data-item-id="${armor.id}"]`);
    
    if (armorElement.length) {
      // Body Location
      if (armor.system.bodyLocation?.sp !== undefined) {
        const bodySP = armor.system.bodyLocation.sp;
        const bodyAblation = armor.system.bodyLocation.ablation || 0;
        const effectiveSP = Math.max(0, bodySP - bodyAblation);
        
        const bodyStatsElement = armorElement.find('.armor-1-stats');
        if (bodyStatsElement.length) {
          bodyStatsElement.text(`${effectiveSP}/${bodySP}`);
        }
      }
      
      // Head Location
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
