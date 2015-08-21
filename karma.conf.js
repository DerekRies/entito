module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['jasmine'],
    files: [
        'src/*.js',
        'tests/*.js'
    ],
    reporters: ['progress'],
    port: 9876,
    runnerPort: 9100,
    colors: true,
    browsers: ['Chrome'],
    autoWatch: true,
    captureTimeout: 60000,
    singleRun: false
  });
}