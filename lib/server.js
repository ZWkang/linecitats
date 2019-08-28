// deps
const debug = require("debug")("linecitats:index");
const compose = require("koa-compose");
const koa = require("koa");

// system libs
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");
const util = require("util");
const Stream = require("stream");

// own package
const Reporter = require("./reporter");

// promisify fs function
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

const app = new koa();

const linecitatsSymbol = Symbol.for("linecitats");

/**
 * module.exports = linecitats;
 */
module.exports = linecitats;

/**
 * normal transform
 */
class MyTransform extends Stream.Transform {
  _transform(chunk, encoding, callback) {
    callback();
    this.push(chunk);
  }
}

/**
 * handle uncaughtException error
 */
process.on("uncaughtException", e => {
  Reporter.error(e.message);
  Reporter.error("cancel process");
  process.exit(1);
});

const pathroot = "/Users/zhouwenkang/oss/doing/linecitats";
/**
 * default options
 */
const defaultOpts = {
  port: "8999",
  host: "127.0.0.1",
  cwd: process.cwd(),
  rootpath: process.cwd(),
  index: "index.html",
  autoClose: Infinity,
  compress: true,
  cache: true,
  dir: "public"
};

/**
 * constuctor linecitats
 */
function linecitats(opts) {
  opts = Object.assign(defaultOpts, opts);

  this.port = opts.port;
  this.host = opts.host;
  this.rootpath = opts.rootpath || opts.cwd;
  this.autoClose = opts.autoClose;
  this.compress = opts.compress;
  this.cache = opts.cache;
  this.compress = opts.compress;
  this.dir = opts.dir;
  this.index = opts.index;
}

/**
 * send file or list floder path
 * @param {Object} koa ctx
 * @param {String} file destPath
 * @param {Object} file stat
 */
const sendFile = async (ctx, destPath, stat) => {
  debug("pass the path %s", destPath);
  if (stat === void 666) {
    let dirList = await readdir(destPath);
    let files = dirList.filter(_ => path.extname(_));
    let floders = dirList.filter(_ => !path.extname(_));

    ctx.status = 200;
    ctx.body = {
      filesList: files,
      flodersList: floders
    };
  } else {
    ctx.destPath = destPath;
    ctx.type = path.extname(destPath);
    ctx.body = fs.createReadStream(destPath);
  }
  return Promise.resolve();
};

/**
 * handle Redirect
 */
const handleRedirect = (ctx, path) => {
  ctx.status = 301;
  ctx.set("Location", path);
  ctx.res.end("Redirecting to " + path);
  return;
};

// 获取地址 做匹配处理
// cwd, root path
/**
 * handle file middleware
 * find path send the file
 */
const handleFile = options => {
  options = Object.assign(options, defaultOpts);
  let index = options.index;
  let rootpath = options.rootpath;
  let dir = options.dir;
  return async (ctx, next) => {
    if (isMalicious(ctx.path)) {
      ctx.status = 403;
      return;
    }
    let ctxPath = safeDecodeURIComponent(path.normalize(ctx.path));
    let fullPath = path.join(rootpath, dir, ctxPath);
    let fullStat = await stat(fullPath).catch(e => null);

    debug("ctxpath = %s", ctxPath);
    debug("fullPath = %s", fullPath);
    if (fullStat === null) {
      // 404
      ctx.status = 404;
      return;
    } else if (fullStat.isDirectory()) {
      let fullPathIndex = await isFile(fullPath + "/" + index);
      if (fullPathIndex && index) {
        ctx.redirect(path.join(ctxPath + index));
        return;
      } else {
        ctx._stat = fullStat;
        await sendFile(ctx, fullPath);
      }
    } else {
      ctx._stat = fullStat;
      await sendFile(ctx, fullPath, fullStat);
    }
    ctx._fullPath = fullPath;
    return await next();
  };
};
/**
 * handle file cache
 */
const handleFileCache = options => {
  options = options;
  return async (ctx, next) => {
    let _fullPath = ctx._fullPath;

    if (!_fullPath || !ctx._stat) return;

    ctx.set("Cache-Control", "max-age=" + 60 * 60 * 30);
    ctx.set("Expires", new Date(Date.now() + 30 * 1000).toUTCString());

    let lastModified = ctx._stat.mtime.toUTCString();
    let fileSum;

    try {
      // let fileContent = await readFile(pathSrc)
      //   .then(content => content.toString("utf-8"))
      //   .catch(e => {
      //     throw e;
      //   });
      // fileSum = fileContent.getHash(fileContent);
      fileSum = stattag(ctx._stat);
    } catch (e) {
      Reporter.error(e.message);
      return;
    }

    debug("request lastModified = %s", ctx.get("If-Modified-Since"));
    debug("now lastModified = %s", lastModified);
    debug("request etagsum = %s", ctx.get("is-none-match"));
    debug("now etagsum = %s", fileSum);

    if (
      lastModified === ctx.get("If-Modified-Since") ||
      fileSum === ctx.get("is-none-match")
    ) {
      ctx.status = 304;
      return;
    }

    ctx.lastModified = lastModified;
    ctx.set("ETag", fileSum);
    ctx.status = 200;
    ctx.type = path.extname(_fullPath);
    return await next();
  };
};

/**
 * handle 404 error
 */
const handleError = async (ctx, next) => {
  return next().then(function() {
    if (ctx.status === 404) {
      ctx.status = 200;
      ctx.body = fs.createReadStream(__dirname + "/404.html");
      ctx.type = path.extname(__dirname + "/404.html");
    }
    return;
  });
};

/**
 * handle compress
 */
const handleCompress = async (ctx, next) => {
  let nextPipe = new MyTransform();
  ctx.vary("Accept-Encoding");
  if (ctx.acceptsEncodings("gzip")) {
    debug(" compress as gzip");
    nextPipe = zlib.createGzip();
    ctx.set("content-encoding", "gzip");
  } else if (ctx.acceptsEncodings("deflate")) {
    debug(" compress as deflate");
    ctx.set("content-encoding", "deflate");
    nextPipe = zlib.createDeflate();
  }
  if (ctx.body && ctx.body.pipe) {
    // will remove content-length
    ctx.body = ctx.body.pipe(nextPipe);
    return;
  }
  return await next();
};

/**
 * init server
 */
linecitats.prototype.init = function() {
  if (this.autoClose !== Infinity) {
    setTimeout(() => {
      Reporter.info("now auto close " + new Date().toDateString());
      this._server.close();
    }, this.autoClose);
  }
  if (this.notfound) {
    app.use(handleError);
  }
  app.use(
    handleFile({ index: this.index, dir: this.dir, rootpath: this.rootpath })
  );
  if (this.cache) {
    app.use(handleFileCache());
  }
  if (this.compress) {
    app.use(handleCompress);
  }

  this._server = app.listen(this.port, () => {
    Reporter.info("starting in port " + this.port);
  });
};

// use for middleware
linecitats.prototype.middleware = function() {
  const handleMiddlewares = [];
  if (this.notfound) {
    handleMiddlewares.push(handleError);
  }
  handleMiddlewares.push(
    handleFile({ index: this.index, dir: this.dir, rootpath: this.rootpath })
  );
  if (this.cache) {
    handleMiddlewares.push(handleFileCache());
  }
  if (this.compress) {
    handleMiddlewares.push(handleCompress);
  }

  return async function(ctx, next) {
    return await compose([handleMiddlewares])(ctx, next);
  };
};

// 关闭
linecitats.prototype.close = function() {
  this._server.close();
};

function isDir(srcPath, cwd = "") {
  return fs.statSync(path.resolve(srcPath, cwd)).isDirectory();
}
// decode url path
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

// 根据地址判断是否为文件
async function isFile(path) {
  return await stat(path)
    .then(_ => !_.isDirectory())
    .catch(_ => false);
}

/**
 * ['path','path','path']
 */

function getHash(str) {
  let shasum = crypto.createHash("sha1");
  return shasum.update(str).digest("base64");
}

// make tag
function stattag(stat) {
  var mtime = stat.mtime.getTime().toString(16);
  var size = stat.size.toString(16);

  return '"' + size + "-" + mtime + '"';
}
/**
 * evil ..
 */
function isMalicious(path) {
  return ~path.indexOf("..");
}
