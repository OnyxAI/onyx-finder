var app = require('electron').app,
    dialog = require('electron').dialog,
    npm = require('npm'),
    path = require('path');

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
    npm.load(function() {

      npm.commands.install(__dirname, ['onyx-finder'], function(err) {

        try {
          require('onyx-finder')(app);
        } catch(e) {
          return dialog.showErrorBox('ERROR', 'Onyx Finder auto update failed! Are you connected to the internet?');
        }

      });

    });

});
