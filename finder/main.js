const {app, ipcMain, dialog, BrowserWindow} = require('electron');
var SSH = require('./ssh.js'),
    Finder = require('./finder'),
    main, terminal;

exports = module.exports = function(app) {

  main = new BrowserWindow({
    width: 300,
    height: 380,
    resizable: false,
    'use-content-size': true
  });

  terminal = new BrowserWindow({
    width: 640,
    height: 384,
    resizable: false,
    show: false,
    'use-content-size': true
  });

  main.loadURL('file://' + __dirname + '/ui/main.html');
  terminal.loadURL('file://' + __dirname + '/ui/terminal.html');

  main.on('closed', function() {

    main = null;

    if(terminal) {
      terminal.close();
    }

  });

  terminal.on('close', function(e) {

    if(main) {
      e.preventDefault();
      main.setSize(500, 550);
      terminal.hide();
      main.webContents.send('reset', false);
      terminal.webContents.send('disconnect', true);
    }

  });

  ipcMain.on('connect', function(e, config) {

    if(config.type == 'upload') {

      var options = {
        title: 'Select a file to upload',
        properties: [ 'openFile' ]
      };

      config.file_upload = dialog.showOpenDialog(options);

      if(! config.file_upload) {
        main.webContents.send('reset', false);
        return main.webContents.send('status', 'Nothing selected to upload.');
      }

      config.file_upload = config.file_upload.toString();

    }

    terminal.show();
    terminal.focus();

    if(config.grayscale)
      terminal.webContents.send('grayscale');

    main.setSize(300, 380);

    main.webContents.send('working', 'Connecting');

    ssh_connect(config);

  });

  ipcMain.on('find', function(e, arg) {

    var finder = Finder();

    main.webContents.send('working', 'Searching');

    finder.start(function(err, ip) {

      if(!ip) {
        return main.webContents.send('reset', true);
      }

      main.webContents.send('found', ip);
      main.setSize(500, 550);
      main.focus();
      main.center();

    });

  });

}

function ssh_connect(config) {

  var ssh = SSH(config);

  ipcMain.on('stdin', function(e, data) {
    if(ssh) {
      ssh.write(data);
    }
  });

  ipcMain.on('disconnect', function() {
    if(ssh) {
      ssh.end();
    }
  });

  ssh.once('data', function() {
    main.webContents.send('status', 'Connected.');
  });

  ssh.on('data', function(data) {
    terminal.webContents.send('stdout', data);
  });

  ssh.on('error', function(err) {
    terminal.webContents.send('stderr', err);
  });

  ssh.on('uploaded', function() {

    if(ssh) {
      ssh.end();
    }

    if(terminal.isVisible()) {
      terminal.close();
      main.focus();
      main.webContents.send('status', 'Upload Complete.');
    }

  });

  ssh.on('done', function() {

    ssh = null;

    if(terminal.isVisible()) {
      terminal.close();
      main.focus();
      main.webContents.send('status', 'Connection closed.');
    }

  });

}
