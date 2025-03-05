export let activeEffect = undefined;

function preCleanEffect(_effect) {
  _effect._depsLength = 0;
  _effect._trackId++; // 每次执行id 都是+1， 如果当前同一个effect执行，id就是相同的
}

function postCleanEffect(effect) {
  // [flag,a,b,c]
  // [flag]  -> effect._depsLength = 1
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度
  }
}

export class ReactiveEffect {
  public _trackId = 0;
  public deps = [];
  public _depsLength = 0;
  public _running = 0
  public active = true; // 确保effect是响应式的
  constructor(public fn, public scheduler) {
  }

  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastEfect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this);
      this._running++;
      return this.fn();
    }
    finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEfect
    }
  }
}

// 定义一个函数 cleanDepEffect，用于清理依赖关系和其对应的效果
function cleanDepEffect(dep, _effect) {
  // 从依赖集合 dep 中删除指定的效果 _effect
  dep.delete(_effect);

  // 检查依赖集合 dep 的大小是否为 0
  if (dep.size == 0) {
    // 如果依赖集合为空，则调用 cleanup 方法进行清理操作
    dep.cleanup()
  }
}

// 导出一个名为 effect 的函数，该函数接收一个函数作为参数
export function effect(fn, options) {
  // 创建一个新的 ReactiveEffect 实例，传入两个参数：
  // 1. 要执行的函数 fn
  // 2. 一个回调函数，用于在依赖变化时重新运行 _effect
  const _effect = new ReactiveEffect(fn, () => {
    // 在回调函数中，调用 _effect 的 run 方法，重新执行 effect
    _effect.run();
  });

  _effect.run();

  if (options) {
    Object.assign(_effect, options)
  }

  // 返回一个函数，该函数用于执行 _effect 的 run 方法
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

// 导出一个名为 trackEffect 的函数，该函数用于跟踪副作用（effect）的依赖关系
export function trackEffect(_effect, dep) {
  // 收集时一个个收集的
  // 需要重新的去收集依赖 ， 将不需要的移除掉
  if (dep.get(_effect) !== _effect._trackId) {
    dep.set(_effect, _effect._trackId);

    let oldDep = _effect.deps[_effect._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanDepEffect(oldDep, _effect)
      }

      _effect.deps[_effect._depsLength++] = dep;
    } else {
      _effect._depsLength++
    }
  }
}

// 导出一个名为 triggerEffects 的函数，该函数接受一个参数 dep
export function triggerEffects(dep) {
  // 使用 for...of 循环遍历 dep 的键（即依赖项）
  for (const _effect of dep.keys()) {
    // 检查当前 _effect 是否有 scheduler 属性，如果有则调用 scheduler 方法
    // console.log('触发更新');
    if (_effect.scheduler) {
      if (!_effect._running) {
        _effect.scheduler();
      }
    }
  }
}