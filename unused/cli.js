const commander = require("commander");

const linecitats = require("./server");

// 解析 Node 进程执行时的参数
commander
  .version("1.0.0")
  // .usage("[options]")
  // .arguments("<source>")
  .option("-p, --port <n>", "server port")
  .option("-o, --host <n>", "server host")
  .option("-r, --rootpath <n>", "server rootpath")
  .option("-i, --index <val>", "auto find index default: index.html")
  .option("-c, --cwd <path>", "setup cwd path")
  .option("-d, --dir <val>", "watch dir")
  .option("-a, --autoclose <val>", "auto close server")
  .option("--no-cache", "no cache")
  .option("--no-compress", "no compress source")
  .parse(process.argv);

// console.log(commander);

const Server = new linecitats(commander);

Server.init();
