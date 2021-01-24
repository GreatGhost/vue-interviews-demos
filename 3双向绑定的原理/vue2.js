// 订阅者
//  vm Vue对象
// exp 属性名
// cb 回调函数

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

function Watcher(vm,exp,cb){
  this.vm=vm;
  this.exp=exp;
  this.cb=cb;
  this.value=this.get();
}

Watcher.prototype={
  constructor:Watcher,
  update(){
    this.run();
    console.log("数据更新")
  },
  run(){
    var newValue=this.vm.data[this.exp];
    var oldValue=this.value;
    if(newValue!=oldValue){
      this.cb.call(this.vm,newValue,oldValue)
    }
  },

  get(){
    Dep.target=this;
    var value=this.vm.data[this.exp];
    Dep.target=null;
    return value;
  }

}
