const handleFile = async (ctx, next) => {
  console.log(ctx.path);
  console.log(path.join(pp, ctx.path));
  let sourcePath;
  // const normalizePath = path.normalize(ctx.path);
  // const rootPath = defaultOpts.cwd || defaultOpts.rootPath || "";
  const rootPath = pathroot;

  let allowPath = [];
  let allowFile = [];

  if (typeof defaultOpts.sourcePath === "string") {
    sourcePath = [defaultOpts.sourcePath];
  } else {
    sourcePath = defaultOpts.sourcePath;
  }

  let inGlobMatch = true;

  // let matchFiles = sourcePath.map(_ => {
  //   if (isGlob(pathItem)) {
  //     inGlobMatch = false;
  //     return glob.sync(pathItem, {
  //       cwd: rootPath
  //     });
  //   }
  // });

  let getAllGlobPath = await Promise.all(
    sourcePath.map(async pathItem => {
      if (isGlob(pathItem)) {
        let pathOrFile = glob.sync(pathItem, { cwd: rootPath });
        // console.log(pathOrFile);
        return await Promise.all(
          pathOrFile.map(async item => {
            if (await isFile(path.join(rootPath, item))) {
              allowPath.push(path.join(rootPath, item));
            } else {
              allowFile.push(path.join(rootPath, item));
            }
          })
        );
      }
      if (await isFile(path.join(pathItem))) {
        allowPath.push(pathItem);
      } else {
        allowFile.push(pathItem);
      }
      return Promise.resolve(pathItem);
    })
  );

  // 去重
  allowPath = [...new Set(allowPath)];
  allowFile = [...new Set(allowFile)];
  // isFile
  // console.log(rootPath, allowPath, allowFile);
  // return;

  // 获得集合path文件夹路径
  // sourcePath = sourcePath
  //   .map(pathItem => {
  //     if (isGlob(pathItem)) {
  //       inGlobMatch = false;
  //       return glob
  //         .sync(pathItem, {
  //           cwd: rootPath
  //         })
  //         .map(_ => path.dirname(path.join(rootPath, _)));
  //     }
  //     return [pathItem];
  //   })
  //   .reduce((prevItem, nextItem) => {
  //     return Array.from(new Set([...prevItem, ...nextItem]));
  //   }, []);
  allowPath = allowPath.sort((a, b) => a - b);

  for (var i = allowPath.length - 1; i > 0; i--) {
    if (allowPath[i].indexOf(allowPath[i - 1]) === 0) {
      allowPath.splice(i, 1);
    }
  }
  let ctxPath = safeDecodeURIComponent(path.normalize(ctx.path));

  let fulldiskPath = path.join(rootPath, ctxPath);

  if (~allowFile.indexOf(fulldiskPath)) {
    sendFile(ctx, fulldiskPath, await stat(fulldiskPath));
  }

  allowPath.some(async _ => {
    // await stat()
    if (await isFile(path.join(rootPath, _))) {
      fulldiskPath = path.join(rootPath, _);
      return true;
    }
    return false;
  });

  if (fulldiskPath) sendFile(ctx, await stat(fulldiskPath));
  // if()

  // if (pathroot) {
  //   ctxPath = path.normalize(path.join(pathroot, ctxPath));
  // }
  // 需要一个入口文件夹
  // 以入口文件夹做glob匹配
};
