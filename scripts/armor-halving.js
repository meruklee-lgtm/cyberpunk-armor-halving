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
  
  const originalPrepareData = CONFIG.Item.documentClass.prototype.prepareDerivedData;
  
  CONFIG.Item.documentClass.prototype.prepareDerivedData = function() {
    originalPrepareData.call(this);
    
    if (this.type === 'armor' && game.settings.get('cyberpunk-armor-halving', 'enabled')) {
      // Body Location
      if (this.system.bodyLocation?.sp !== undefined) {
        this.system.bodyLocation.sp = Math.floor(this.system.bodyLocation.sp / 2);
        
        // Ablation kann nicht größer als SP sein (verhindert negative Werte)
        if (this.system.bodyLocation.ablation > this.system.bodyLocation.sp) {
          this.system.bodyLocation.ablation = this.system.bodyLocation.sp;
        }
      }
      
      // Head Location
      if (this.system.headLocation?.sp !== undefined) {
        this.system.headLocation.sp = Math.floor(this.system.headLocation.sp / 2);
        
        // Ablation kann nicht größer als SP sein
        if (this.system.headLocation.ablation > this.system.headLocation.sp) {
          this.system.headLocation.ablation = this.system.headLocation.sp;
        }
      }
      
      // Shields (optional)
      if (game.settings.get('cyberpunk-armor-halving', 'halveshields')) {
        if (this.system.shieldHitPoints?.max !== undefined) {
          this.system.shieldHitPoints.max = Math.floor(this.system.shieldHitPoints.max / 2);
          if (this.system.shieldHitPoints.value > this.system.shieldHitPoints.max) {
            this.system.shieldHitPoints.value = this.system.shieldHitPoints.max;
          }
        }
      }
    }
  };
  
  console.log('Cyberpunk Armor Halving | Armor-Patch erfolgreich angewendet');
});

Hooks.on('renderItemSheet', (app, html, data) => {
  if (!game.settings.get('cyberpunk-armor-halving', 'enabled')) return;
  if (app.item.type !== 'armor') return;
  
  html.find('.window-title').append(' <span style="color: #ff6b6b; font-size: 0.8em;">[SP halbiert]</span>');
});
