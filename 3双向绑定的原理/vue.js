/**
 * 监听器
 * @param {Object} data vue数据对象
 */
function observe(data) {
  if(!data || typeof data != 'object') {
    return ;
  }
  Object.keys(data).forEach(function(key) {
    defineReactive(data, key, data[key]);
  })
}
 
function defineReactive(data, key, val) {
  observe(val);
  var dep = new Dep();
  Object.defineProperty(data,key,{
    configurable: true,
    enumerable: true,
    set: function(newVal) {
      val = newVal; // val默认变量
      console.log('属性：' + key + '已经被监听，现在的值为：'+ newVal);
      dep.notify();
    },
    get: function() {
      if (Dep.target) {
        dep.subs.push(Dep.target);
      }
      return val;
    }
  })
}

/**
 * 订阅器
 */
function Dep() {
  this.subs = [];
  this.target = null;
}
 
Dep.prototype = {
  constructor: Dep,
  addSub: function(sub) { // 添加订阅者
    this.subs.push(sub);
  },
  notify: function() { // 通知订阅者
    this.subs.forEach(function(sub) {
      sub.update();
    })
  }
}

/**
 * 订阅者
 * @param {Object} vm vue对象
 * @param {String} exp 属性名
 * @param {Function} cb 回调函数
 */
function Watcher(vm, exp, cb) {
  this.vm = vm;
  this.exp = exp;
  this.cb = cb;
  this.value = this.get();
}
 
Watcher.prototype = {
  constructor: Watcher,
  update: function() {
    this.run();
  },
  run: function() {
    var newVal = this.vm.data[this.exp];
    var oldVal = this.value;
    if(newVal != oldVal) {
      this.cb.call(this.vm, newVal, oldVal);
    }
  },
  get: function() {
    Dep.target = this;
    var value = this.vm.data[this.exp];
    Dep.target = null;
    return value;
  }
}

/**
 * 编译器
 * @param {String} el 根元素
 * @param {Object} vm vue对象
 */
function Compile(el, vm) {
  this.el = document.querySelector(el);
  this.vm = vm;
  this.fragment = null;
  this.init();
}
 
Compile.prototype = {
  constructor: Compile,
  init: function() {
    if (this.el) {
      this.fragment = this.nodeToFragment(this.el); // 移除页面元素生成文档碎片
      this.compileElement(this.fragment); // 编译文档碎片
      this.el.appendChild(this.fragment);
    } else {
      console.log('DOM Selector is not exist');
    }
  },
  /**
   * 页面DOM节点转化成文档碎片
   */
  nodeToFragment: function(el) {
    var fragment = document.createDocumentFragment();
    var child = el.firstChild;
    while(child) {
      fragment.appendChild(child); // append后，原el上的子节点被删除了，挂载在文档碎片上
      child = el.firstChild;
    }
    return fragment;
  },
  /**
   * 编译文档碎片，遍历到当前是文本节点，则编译文本节点；如果当前是元素节点，并且存在子节点，则继续递归遍历
   */
  compileElement: function(fragment) {
    var childNodes = fragment.childNodes;
    var self = this;
    [].slice.call(childNodes).forEach(function(node) {
      var reg = /\{\{\s*((?:.|\n)+?)\s*\}\}/g;
      var text = node.textContent;
 
      if (self.isElementNode(node)) {
        self.compileAttr(node);
      } else if (self.isTextNode(node) && reg.test(text)) { // test() 方法用于检测一个字符串是否匹配某个模式
        reg.lastIndex = 0
        self.compileText(node, reg.exec(text)[1]); // exec() 方法用于检索字符串中的正则表达式的匹配
      }
 
      if (node.childNodes && node.childNodes.length) { // 递归遍历
        self.compileElement(node);
      }
    })
  },
  /**
   * 编译属性
   */
  compileAttr: function(node) {
    var self = this;
    var nodeAttrs = node.attributes;
 
    Array.prototype.forEach.call(nodeAttrs, function(attr) {
      var attrName = attr.name; // attrName是DOM属性名，而exp是vue对象属性名
      
      if (self.isDirective(attrName)) { // 只对vue本身指令进行操作
        var exp = attr.value; // 属性名或函数名
        if (self.isOnDirective(attrName)) { // v-on指令
          self.compileOn(node, self.vm, attrName, exp);
        } else if (self.isBindDirective(attrName)) { // v-bind指令
          self.compileBind(node, self.vm, attrName, exp);
        } else if (self.isModelDirective(attrName)) { // v-model
          self.compileModel(node, self.vm, attrName, exp);
        }
        
        node.removeAttribute(attrName);
      }
    })
  },
  /**
   * 编译v-on指令
   */
  compileOn: function(node, vm, attrName, exp) {
    var onReg = /^v-on:|^@/;
    var eventType = attrName.replace(onReg, '');
    var cb = vm.methods[exp];
 
    node.addEventListener(eventType, cb.bind(vm), false);
  },
  /**
   * 编译v-bind指令
   */
  compileBind: function(node, vm, attrName, exp) {
    var bindReg = /^v-bind:|^:/;
    var attr = attrName.replace(bindReg, '');
    
    node.setAttribute(attr, vm.data[exp]);
 
    new Watcher(vm, exp, function(val) {
      node.setAttribute(attr, val);
    });
  },
  /**
   * 编译v-model指令
   */
  compileModel: function(node, vm, attrName, exp) {
    var self = this;
    var modelReg = /^v-model/;
    var attr = attrName.replace(modelReg, '');
    var val = vm.data[exp];
    
    self.updateModel(node, val); // 初始化视图
 
    new Watcher(vm, exp, function(value) { // 添加一个订阅者到订阅器
     self.updateModel(node, value);
    });
 
    node.addEventListener('input', function(e) { // 绑定input事件
      var newVal = e.target.value;
      if (val == newVal) {
        return;
      }
      self.vm.data[exp] = newVal;
    }, false);
  },
 
  /**
   * 属性是否是vue指令，包括v-xxx:,:xxx,@xxx
   */
  isDirective: function(attrName) {
    var dirReg = /^v-|^:|^@/;
    return dirReg.test(attrName);
  },
  /**
   * 属性是否是v-on指令
   */
  isOnDirective: function(attrName) {
    var onReg = /^v-on:|^@/;
    return onReg.test(attrName);
  },
  /**
   * 属性是否是v-bind指令
   */
  isBindDirective: function(attrName) {
    var bindReg = /^v-bind:|^:/;
    return bindReg.test(attrName);
  },
  /**
   * 属性是否是v-model指令
   */
  isModelDirective: function(attrName) {
    var modelReg = /^v-model/;
    return modelReg.test(attrName);
  },
  /**
   * 编译文档碎片节点文本，即对标记替换
   */
  compileText: function(node, exp) {
    var self = this;
    var initText = this.vm.data[exp];
 
    this.updateText(node, initText); // 初始化视图
 
    new Watcher(this.vm, exp, function(val) {
      self.updateText(node, val); // node?
    });
  },
  /**
   * 更新文本节点
   */
  updateText(node, val) {
    node.textContent = typeof val == 'undefined'? '': val;
  },
  updateModel(node, val, oldVal) {
    node.value = typeof val == 'undefined'? '': val;
  },
  /**
   * 判断元素节点
   */
  isElementNode(node) {
    return node.nodeType == 1;
  },
  /**
   * 判断文本节点
   */
  isTextNode(node) {
    return node.nodeType == 3;
  }
}
