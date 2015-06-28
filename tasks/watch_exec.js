/*
 * grunt-watch-exec
 * https://github.com/sqm/grunt-watch-exec
 *
 * Copyright (c) 2015 Squaremouth
 * Licensed under the MIT license.
 */

'use strict';

var exec = require('child_process').exec;
var Gaze = require('gaze').Gaze;
var watchers = [];

module.exports = function(grunt) {
  var _ = grunt.util._;

  grunt.registerTask('watch_exec', 'Run configured commands whenever watched files change.', function() {
    var self = this,
        done = this.async();

    // Close any previously opened watchers
    watchers.forEach(function(watcher) {
      watcher.close();
    });
    watchers = [];

    _.each(grunt.config('watch_exec'), function(options, target, config) {
      var params = [],
          patterns = _.keys(options.files);

      var process = _.debounce(function() {
        var command = options.command + ' ' + params.join(' '),
            process = exec(command);

        params = [];

        process.stdout.on('data', function(d) { grunt.log.write(d); });
        process.stderr.on('data', function(d) { grunt.log.error(d); });
      }, 300);

      patterns.forEach(function(pattern) {
        watchers.push(new Gaze(pattern, function(err) {
          this.on('all', function(status, filepath) {
            if (filepath === '') {
              return;
            }

            var translator = options.files[pattern];
            params.push(typeof translator === 'function' ? translator(filepath) : filepath);

            process();
          });

          this.on('error', function(watcherError) {
            if (typeof watcherError === 'string') { watcherError = new Error(watcherError); }
            grunt.log.error(watcherError.message);
          });
        }));
      });

    });

  });
};
