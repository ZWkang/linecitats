# linecitats

one common line to generator a static server

## Usage

```js
  .option("-p, --port <n>", "server port")
  .option("-o, --host <n>", "server host")
  .option("-r, --rootpath <n>", "server rootpath")
  .option("-i, --index <val>", "auto find index default: index.html")
  .option("-c, --cwd <path>", "setup cwd path")
  .option("-d, --dir <val>", "watch dir")
  .option("-a, --autoclose <val>", "auto close server")
  .option("--no-open", "not to auto open")
  .option("--no-cache", "no cache")
  .option("--no-compress", "no compress source")
```

```js
npm install -g linecitats
```

```js
linecitats --help
```

## API

- #### -v, --version

ouput the linecitats version

- #### -p, --port

setup server listening port(in [port, port + 1000] range)

- #### -h, --host

setup server listening host

- #### -r, --rootpath

setup listening work rootpath

- #### -i, --index

setup find index file name : default is index.html

- #### -c, --cwd

setup the work path base

- #### -d, --dir

setup the listening floder

- #### -a, --autoclose

set the server close time

- #### --no-open

not to auto open brrowser

- #### --no-cache

not to use cache

- #### --no-compress

not to use compress

- #### -h, --help

show help list

## LICENSE

[MIT](/LICENSE)
