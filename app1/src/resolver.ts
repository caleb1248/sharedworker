import path from 'path-browserify';

var isCore = require('is-core-module');
var caller = require('./caller');
var nodeModulesPaths = require('./node-modules-paths');
var normalizeOptions = require('./normalize-options');
var homedir = '/';
var defaultPaths = function () {
  return [];
};

var maybeRealpathSync = function maybeRealpathSync(realpathSync, x, opts) {
  if (opts && opts.preserveSymlinks === false) {
    return realpathSync(x);
  }
  return x;
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
  var dirs = nodeModulesPaths(start, opts, x);
  for (var i = 0; i < dirs.length; i++) {
    dirs[i] = path.join(dirs[i], x);
  }
  return dirs;
};

export default function resolveSync(x, options) {
  if (typeof x !== 'string') {
    throw new TypeError('Path must be a string.');
  }
  var opts = normalizeOptions(x, options);

  var isFile = opts.isFile;
  var readFileSync = opts.readFileSync;
  var isDirectory = opts.isDirectory;
  var realpathSync = opts.realpathSync;

  var extensions = opts.extensions || ['.js'];
  var includeCoreModules = opts.includeCoreModules !== false;
  var basedir = opts.basedir || path.dirname(caller());
  var parent = opts.filename || basedir;

  opts.paths = opts.paths || defaultPaths();

  // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
  var absoluteStart = maybeRealpathSync(
    realpathSync,
    path.resolve(basedir),
    opts
  );

  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
    var res = path.resolve(absoluteStart, x);
    if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
    var m = loadAsFileSync(res) || loadAsDirectorySync(res);
    if (m) return maybeRealpathSync(realpathSync, m, opts);
  } else if (includeCoreModules && isCore(x)) {
    return x;
  } else {
    var n = loadNodeModulesSync(x, absoluteStart);
    if (n) return maybeRealpathSync(realpathSync, n, opts);
  }

  var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
  err.name = 'MODULE_NOT_FOUND';
  throw err;

  function loadAsFileSync(x: string) {
    var pkg = loadpkg(path.dirname(x));

    if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
      var rfile = path.relative(pkg.dir, x);
      var r = opts.pathFilter(pkg.pkg, x, rfile);
      if (r) {
        x = path.resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
      }
    }

    if (isFile(x)) {
      return x;
    }

    for (var i = 0; i < extensions.length; i++) {
      var file = x + extensions[i];
      if (isFile(file)) {
        return file;
      }
    }
  }

  function loadpkg(dir: string) {
    if (dir === '' || dir === '/') return;

    if (/[/\\]node_modules[/\\]*$/.test(dir)) return;

    var pkgfile = path.join(
      maybeRealpathSync(realpathSync, dir, opts),
      'package.json'
    );

    if (!isFile(pkgfile)) {
      return loadpkg(path.dirname(dir));
    }

    var pkg = readPackageSync(readFileSync, pkgfile);

    if (pkg && opts.packageFilter) {
      // v2 will pass pkgfile
      pkg = opts.packageFilter(pkg, /*pkgfile,*/ dir); // eslint-disable-line spaced-comment
    }

    return { pkg: pkg, dir: dir };
  }

  function loadAsDirectorySync(x) {
    var pkgfile = path.join(
      maybeRealpathSync(realpathSync, x, opts),
      '/package.json'
    );
    if (isFile(pkgfile)) {
      try {
        var pkg = readPackageSync(readFileSync, pkgfile);
      } catch (e) {}

      if (pkg && opts.packageFilter) {
        // v2 will pass pkgfile
        pkg = opts.packageFilter(pkg, /*pkgfile,*/ x); // eslint-disable-line spaced-comment
      }

      if (pkg && pkg.main) {
        if (typeof pkg.main !== 'string') {
          var mainError = new TypeError(
            'package “' + pkg.name + '” `main` must be a string'
          );
          mainError.code = 'INVALID_PACKAGE_MAIN';
          throw mainError;
        }
        if (pkg.main === '.' || pkg.main === './') {
          pkg.main = 'index';
        }
        try {
          var m = loadAsFileSync(path.resolve(x, pkg.main));
          if (m) return m;
          var n = loadAsDirectorySync(path.resolve(x, pkg.main));
          if (n) return n;
        } catch (e) {}
      }
    }

    return loadAsFileSync(path.join(x, '/index'));
  }

  function loadNodeModulesSync(x, start) {
    var thunk = function () {
      return getPackageCandidates(x, start, opts);
    };
    var dirs = packageIterator
      ? packageIterator(x, start, thunk, opts)
      : thunk();

    for (var i = 0; i < dirs.length; i++) {
      var dir = dirs[i];
      if (isDirectory(path.dirname(dir))) {
        var m = loadAsFileSync(dir);
        if (m) return m;
        var n = loadAsDirectorySync(dir);
        if (n) return n;
      }
    }
  }
}
