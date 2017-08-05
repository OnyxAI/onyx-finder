var SSH = require('ssh2'),
    events = require('events'),
    path = require('path'),
    fs = require('fs'),
    util = require('util');

/**** ssh is an event emitter ****/
util.inherits(ssh, events.EventEmitter);

/**** Finder prototype ****/
var proto = ssh.prototype;

/**** Expose ssh ****/
exports = module.exports = ssh;

/**** ssh constructor ****/
function ssh(options) {

  if (!(this instanceof ssh)) {
    return new ssh(options);
  }

  events.EventEmitter.call(this);

  util._extend(this, options || {});

  this.ssh = new SSH();

  this.ssh.on('ready', this.handleReady.bind(this));
  this.ssh.on('error', this.handleError.bind(this));
  this.ssh.connect({
    username: this.username,
    password: this.password,
    host: this.host,
    port: this.port
  });

}

proto.ssh = false;
proto.stdin = false;
proto.username = 'pi';
proto.password = 'onyx';
proto.host = '10.0.1.1';
proto.port = 22;
proto.type = 'shell';
proto.pi_config = {};

proto.handleError = function(err) {
  this.emit('error', err.toString());
};

proto.handleData = function(data) {
  this.emit('data', data.toString());
};

proto.handleClose = function() {
  this.emit('done');
};

proto.write = function(data) {

  if(! this.stdin) {
    return;
  }

  this.stdin.write(data);

};

proto.end = function() {

  if(! this.stdin) {
    return;
  }

  this.ssh.end();

};

proto.handleReady = function() {

  this[this.type].call(this);

};

proto.shutdown = function() {

  this.ssh.exec('sudo shutdown -h now', function(err, stream) {

    if(err) {
      return this.handleError(err);
    }

    this.stdin = stream;

    stream.on('error', this.handleError.bind(this));
    stream.on('data', this.handleData.bind(this));
    stream.on('close', this.handleClose.bind(this));
    stream.stderr.on('data', this.handleError.bind(this));

  }.bind(this));

};

proto.reboot = function() {

  this.ssh.exec('sudo reboot', function(err, stream) {

    if(err) {
      return this.handleError(err);
    }

    this.stdin = stream;

    stream.on('error', this.handleError.bind(this));
    stream.on('data', this.handleData.bind(this));
    stream.on('close', this.handleClose.bind(this));
    stream.stderr.on('data', this.handleError.bind(this));

  }.bind(this));

};

proto.upload = function() {

  if(! this.file_upload || ! fs.existsSync(this.file_upload)) {
    return this.handleError('no file specified');
  }

  var size = parseInt(fs.statSync(this.file_upload).size / 1000);

  this.free(function(err, available) {

    if(! available) {
      return this.handleError(err || 'there is not enough space available to upload the selected file');
    }

    if(available <= size) {
      return this.handleError('there is not enough space available to upload the selected file');
    }

    this.send_file();

  }.bind(this));

};


proto.send_file = function() {

  var self = this;

  this.ssh.sftp(function(err, sftp) {

    if(err) {
      return self.handleError(err);
    }

    var dest = '/home/' + self.username + '/' + path.basename(self.file_upload);

    var progress = function(uploaded, chunk, total) {
      var percent = ((uploaded / total) * 100).toFixed(2);
      self.handleData('\x1bc');
      self.handleData(percent + '% complete\n');
    };

    sftp.fastPut(self.file_upload, dest, { step: progress }, function(err) {

      if(err) {
        return self.handleError(err);
      }

      self.emit('uploaded');

    });

  });

};

proto.free = function(cb) {

  this.ssh.exec('df /home | tail -1 | tr -s " " | cut -f 4 -d " "', function(err, stream) {

    var data = '';

    if(err) {
      return cb(err);
    }

    stream.on('exit', function(code, signal) {

      if(code) {
        return cb('unable to calculate the free space available');
      }

      cb(null, parseInt(data) || 0);

    }).on('data', function(d) {
      data += d;
    });

  });

};

proto.bootstrap = function() {

  var opts = {
    pty: {
      rows: 31,
      cols: 80,
      height: 384,
      width: 640,
      term: 'xterm-color'
    }
  };

  this.ssh.exec(this.buildCommand(), opts, function(err, stream) {

    if(err) {
      return this.handleError(err);
    }

    this.stdin = stream;

    stream.on('error', this.handleError.bind(this));
    stream.on('data', this.handleData.bind(this));
    stream.on('close', this.handleClose.bind(this));
    stream.stderr.on('data', this.handleError.bind(this));

  }.bind(this));

};

proto.shell = function() {

  var win = {
    rows: 31,
    cols: 80,
    height: 384,
    width: 640,
    term: 'xterm-color'
  };

  this.ssh.shell(win, function(err, stream) {

    if(err) {
      return this.handleError(err);
    }

    this.stdin = stream;

    stream.on('error', this.handleError.bind(this));
    stream.on('data', this.handleData.bind(this));
    stream.on('close', this.handleClose.bind(this));
    stream.stderr.on('data', this.handleError.bind(this));

  }.bind(this));

};
