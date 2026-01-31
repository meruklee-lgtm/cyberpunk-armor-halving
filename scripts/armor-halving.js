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
  
  console.log('Cyberpunk Armor Halving | Aktiviert - Panzerungswerte werden halbiert');
  
  // Patch die prepareDerivedData Methode für Armor Items
  const originalPrepareData = CONFIG.Item.documentClass.prototype.prepareDerivedData;
  
  CONFIG.Item.documentClass.prototype.prepareDerivedData = function() {
    originalPrepareData.call(this);
    
    // Nur für Armor-Items und nur wenn aktiviert
    if (this.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
      // Halbiere Body Location SP
      if (this.system.bodyLocation?.sp !== undefined) {
        const originalBodySP = this.system.bodyLocation.sp;
        const halvedValue = Math.floor(originalBodySP / 2);
        // Verhindere negative Werte
        this.system.bodyLocation.sp = Math.max(0, halvedValue);
      }
      
      // Halbiere Head Location SP
      if (this.system.headLocation?.sp !== undefined) {
        const originalHeadSP = this.system.headLocation.sp;
        const halvedValue = Math.floor(originalHeadSP / 2);
        // Verhindere negative Werte
        this.system.headLocation.sp = Math.max(0, halvedValue);
      }
      
      // Optional: Halbiere auch Shield Hit Points (wenn aktiviert)
      if (game.settings.get('cyberpunk-armor-halving', 'halveshields')) {
        if (this.system.shieldHitPoints?.max !== undefined) {
          const originalShieldMax = this.system.shieldHitPoints.max;
          this.system.shieldHitPoints.max = Math.max(0, Math.floor(originalShieldMax / 2));
          
          // Passe auch den aktuellen Wert an
          if (this.system.shieldHitPoints.value > this.system.shieldHitPoints.max) {
            this.system.shieldHitPoints.value = this.system.shieldHitPoints.max;
          }
        }
      }
    }
  };
  
  console.log('Cyberpunk Armor Halving | Armor-Patch erfolgreich angewendet');
});

// Zeige halbierten Wert visuell im Character Sheet
Hooks.on('renderItemSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  if (app.item.type !== 'armor') return;
  
  // Füge visuellen Hinweis hinzu
  html.find('.window-title').append(' <span style="color: #ff6b6b; font-size: 0.8em;">[SP halbiert]</span>');
});
