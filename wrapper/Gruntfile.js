module.exports = function(grunt) {
  grunt.initConfig({
    'build-electron-app': {
      options: {
        build_dir: '../build',
        platforms: ['darwin', 'win32', 'linux32', 'linux64'],
        cache_dir: (process.env.TMPDIR || process.env.TEMP || '/tmp') + 'electron-cache',
        app_dir: './'
      }
    },
    clean: {
      options: {
        force: true
      },
      all: ['../build', '*.zip', '*.tar', '*.tar.gz'],
      symlink: ['../build/darwin/Electron.app/Contents/Resources/app']
    },
    rename: {
      mac: {
        files: [
          { src: ['../build/darwin/Electron.app'], dest: '../build/darwin/Onyx Finder.app' },
          { src: ['../build/darwin/Onyx Finder.app/Contents/MacOS/Electron'], dest: '../build/darwin/Onyx Finder.app/Contents/MacOS/Onyx Finder' }
        ]
      },
      linux: {
        files: [
          { src: ['../build/linux32/electron'], dest: '../build/linux32/onyxfinder' },
          { src: ['../build/linux64/electron'], dest: '../build/linux64/onyxfinder' }
        ]
      },
      win: {
        files: [
          { src: ['../build/win32/Electron.exe'], dest: '../build/win32/OnyxFinder.exe' }
        ]
      }
    },
    copy: {
      mac: {
        files: [
          { src: 'icons/onyx.icns', dest: '../build/darwin/Onyx Finder.app/Contents/Resources/atom.icns' }
        ]
      },
      win: {
        files: [
          { src: 'icons/onyx.ico', dest: '../build/win32/resources/onyx.ico' }
        ]
      }
    },
    sed: {
      bundle: {
        pattern: '<string>Electron</string>',
        replacement: '<string>Onyx Finder</string>',
        path: '../build/darwin/Onyx Finder.app/Contents/Info.plist'
      }
    },
    winresourcer: {
      exe: {
        operation: 'Update',
        exeFile: '../build/win32/OnyxFinder.exe',
        resourceType: 'Icongroup',
        resourceName: '1',
        lang: 1033,
        resourceFile: 'icons/onyx.ico'
      }
    },
    chmod: {
      options: {
        mode: '755'
      },
      linux: {
        src: [
          '../build/linux64/onyxfinder',
          '../build/linux32/onyxfinder'
        ]
      }
    },
    symlink: {
      options: {
        overwrite: false
      },
      dev: {
        src: './',
        dest: '../build/darwin/Electron.app/Contents/Resources/app'
      }
    },
    compress: {
      options: {
        force: true
      },
      mac: {
        options: {
          archive: 'pibootstrap_mac.zip'
        },
        expand: true,
        cwd: '../build/darwin/atom-shell/',
        src: ['**'],
        dest: './'
      },
      windows: {
        options: {
          archive: 'pibootstrap_windows.zip'
        },
        expand: true,
        cwd: '../build/win32/atom-shell/',
        src: ['**'],
        dest:'./'
      },
      linux32: {
        options: {
          archive: 'pibootstrap_linux32.tar.gz',
          mode: 'tgz'
        },
        expand: true,
        cwd: '../build/linux32/atom-shell/',
        src: ['**'],
        dest:'pibootstrap/'
      },
      linux64: {
        options: {
          archive: 'pibootstrap_linux64.tar.gz',
          mode: 'tgz'
        },
        expand: true,
        cwd: '../build/linux64/atom-shell/',
        src: ['**'],
        dest:'pibootstrap/'
      }
    }

  });

  grunt.loadNpmTasks('grunt-electron-app-builder');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-sed');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('winresourcer');
  grunt.loadNpmTasks('grunt-chmod');
  grunt.loadNpmTasks('grunt-contrib-symlink');

  grunt.registerTask('default', ['clean:all', 'build-electron-app', 'clean:symlink', 'symlink']);
  grunt.registerTask('build', ['clean:all', 'build-electron-app', 'rename', 'copy', 'chmod', 'sed', 'winresourcer']);

};
