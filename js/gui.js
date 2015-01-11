var gui = require('nw.gui');
var win = gui.Window.get();

// Create option for each shortcut
var copy_option = {
  key: 'Ctrl+C',
  active: function() { document.execCommand('copy'); },
  failed: function(msg) { console.log(msg); }
};

var paste_option = {
  key: 'Ctrl+V',
  active: function() { document.execCommand('paste'); },
  failed: function(msg) { console.log(msg); }
};

var cut_option = {
  key: 'Ctrl+X',
  active: function() { document.execCommand('cut'); },
  failed: function(msg) { console.log(msg); }
};

// Create a shortcut with shortcut option
var copy_shortcut = new gui.Shortcut(copy_option);
var paste_shortcut = new gui.Shortcut(paste_option);
var cut_shortcut = new gui.Shortcut(cut_option);

win.on('focus',function() {
  // Register global desktop shortcut, which can work without focus.
  gui.App.registerGlobalHotKey(copy_shortcut);
  gui.App.registerGlobalHotKey(paste_shortcut);
  gui.App.registerGlobalHotKey(cut_shortcut);
});

win.on('blur', function() {
  // Unregister the global desktop shortcut.
  gui.App.unregisterGlobalHotKey(copy_shortcut);
  gui.App.unregisterGlobalHotKey(paste_shortcut);
  gui.App.unregisterGlobalHotKey(cut_shortcut);
});


function Menu() {
  this.menu = new gui.Menu();
  this.cut = new gui.MenuItem({
    label: '剪下',
    click: function() { document.execCommand('cut'); }
  });

  this.copy = new gui.MenuItem({
    label: '複製',
    click: function() { document.execCommand('copy'); }
  });

  this.paste = new gui.MenuItem({
    label: '貼上',
    click: function() { document.execCommand('paste'); }
  });

  this.menu.append(this.cut);
  this.menu.append(this.copy);
  this.menu.append(this.paste);
}

Menu.prototype.canCopy = function (bool) {
  this.cut.enabled = bool;
  this.copy.enabled = bool;
};

Menu.prototype.canPaste = function (bool) {
  this.paste.enabled = bool;
};

Menu.prototype.popup = function (x, y) {
  this.menu.popup(x, y);
};

var menu = new Menu();

$(document).on('contextmenu', function (e) {
  e.preventDefault();
  var $target = $(e.target);
  var selectionType = window.getSelection().type.toUpperCase();
  if ($target.is(':text')) {
    var clipData = gui.Clipboard.get().get();
    menu.canPaste(clipData.length > 0);
    menu.canCopy(selectionType === 'RANGE');
    menu.popup(e.originalEvent.x, e.originalEvent.y);
  }
});