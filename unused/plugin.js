// class Plugin {
//   constructor() {
//     this.plugins = new Map();
//   }
//   set(key, plugin) {
//     this.plugins.set(key, plugin);
//   }
//   get(key) {
//     this.plugins.get(key)
//   }

//   start() {

//   }
// }

function PluginManger() {
  this.plugins = new WeakMap();
}

PluginManger.prototype.set = function(key, plugin) {
  this.plugins.set(key, plugin);
  return this;
};

PluginManger.prototype.remove = function(key) {
  this.plugins.delete(key);
  return this;
};

PluginManger.prototype.has = function(key) {
  return this.plugins.has(key);
};

PluginManger.prototype.get = function(key) {
  return this.plugins.get(key);
};

module.exports = PluginManger;
