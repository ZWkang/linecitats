const chalk = require("chalk");
const path = require("path");

const pkg = require(path.join(__dirname, "..", "package.json"));

class Reporter {
  info(content) {
    console.info(chalk.yellow(`[${pkg.name}][${pkg.version}]: ${content}`));
  }
  error(content) {
    console.error(chalk.red(`[${pkg.name}][${pkg.version}]: ${content}`));
  }
  success(content) {
    console.log(chalk.green(`[${pkg.name}][${pkg.version}]: ${content}`));
  }
}

module.exports = new Reporter();
