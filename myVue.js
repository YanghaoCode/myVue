/**
 * @功能名称:
 * @文件名称: myVue.js
 * @Date: 2019/9/20 下午3:37.
 * @Author: yanghao
 */

class MyVue {
  constructor(option) {
    this.$options = option
    this.$data = option.data
    this.observer(this.$data)

    new Compile(option.el, this);
    // created执行
    if (option.created) {
      option.created.call(this);
    }
  }
  observer(data) {
    if (!(data instanceof Object)) {
      return
    }
    Object.keys(data).forEach(key=>{
      let value = data[key]
      this.defineReactive(data, key, value)
      this.proxyData(key,value)
    })
  }

  defineReactive(obj, item, value) {
    this.observer(value)
    let dep = new Dep()
    Object.defineProperty(obj, item, {
      get() {
        Dep.target && dep.addDep(Dep.target)
        return value
      },
      set(newVal) {
        if (newVal === value) return
        value = newVal
        dep.notify()
      }
    })
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      get(){
        return this.$data[key]
      },
      set(newVal){
        this.$data[key] = newVal;
      }
    })
  }
}

class Dep {
  constructor() {
    this.arrDep =[]
  }
  addDep(watcher) {
    this.arrDep.push(watcher)
  }
  notify(){
    this.arrDep.forEach(item=>{
      item.update()
    })
  }
}

class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm;
    this.key = key;
    this.cb = cb;
    Dep.target = this;
    this.vm[key];
    Dep.target = null
  }

  update() {
    this.cb.call(this.vm, this.vm[this.key])
  }
}