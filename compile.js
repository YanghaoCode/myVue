// 用法 new Compile(el, vm)

class Compile {
  constructor(el, vm) {
    // 要遍历的宿主节点
    this.$el = document.querySelector(el);
    this.$vm = vm;

    this.fragment = this.node2Fragment(this.$el)
    this.compile(this.fragment)
    this.$el.appendChild(this.fragment);
  }

  // 将宿主元素中代码片段拿出来遍历，这样做比较高效
  node2Fragment(el) {
    let fragment = document.createDocumentFragment();
    let child;
    while((child=el.firstChild)) {
      fragment.appendChild(child)
    }
    return fragment
  }
  // 编译过程
  compile(el) {
    Array.from(el.childNodes).forEach(node=>{
      //console.log("node", node)
      if (this.isInterpolation(node)) {
        //console.log("RegExp.$1",RegExp.$1)
        this.compileText(node, RegExp.$1)
      }
      if (node.nodeType === 1) {
        Array.from(node.attributes).forEach(item=>{
          if (this.isEvent(item.name)) {
            let dir = item.name.substring(1)
            this.addEvent(dir, item.value, node)
          }
          if (this.isDirective(item.name)) {
            let dir = item.name.substring(2)
            if (dir === 'text') {
              this.compileText(node, item.value)
            } else if ( dir === 'model') {
              this.inputText(node, item.value)
            }
          }
        })
      }
      // 递归子节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    })
  }

  compileText(node, exp) {
    node.textContent = this.$vm[exp]

    new Watcher(this.$vm, exp, function(value) {
      node.textContent = value
    })
  }

  inputText(node, exp) {
    console.log("node input", node)
    node.value = this.$vm[exp]

    node.addEventListener('input', (e)=> {
      this.$vm[exp] = e.target.value
    })

    new Watcher(this.$vm, exp, function(value) {
      node.value = value
    })
  }

  isEvent(attr) {
    return attr.indexOf('@') === 0
  }
  isDirective(name) {
    console.log("name", name)
    return name.indexOf('v-') === 0
  }

  addEvent(dir,key, node) {
    node.addEventListener(dir, this.$vm.$options.methods[key].bind(this.$vm))
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updaterFn = this[dir + "Updater"];
    // 初始化
    updaterFn && updaterFn(node, vm[exp]);
    // 依赖收集
    new Watcher(vm, exp, function(value) {
      updaterFn && updaterFn(node, value);
    });
  }

  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }

  //   双绑
  model(node, vm, exp) {
    // 指定input的value属性
    this.update(node, vm, exp, "model");

    // 视图对模型响应
    node.addEventListener("input", e => {
      vm[exp] = e.target.value;
    });
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  //   事件处理器
  eventHandler(node, vm, exp, dir) {
    //   @click="onClick"
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }

  isElement(node) {
    return node.nodeType === 1;
  }
   插值文本
  isInterpolation(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
}
