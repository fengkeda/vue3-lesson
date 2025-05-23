import { DirtyLevels } from "./constants";
export let activeEffect = undefined;

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

function preCleanEffect(_effect) {
  _effect._depsLength = 0;
  _effect._trackId++; // 每次执行id 都是+1， 如果当前同一个effect执行，id就是相同的
}

function postCleanEffect(effect) {
  // [flag,a,b,c]
  // [flag]  -> effect._depsLength = 1
  // 如果effect的依赖列表长度大于effect._depsLength
  if (effect.deps.length > effect._depsLength) {
    // 遍历effect的依赖列表，从effect._depsLength开始
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中对应的effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表的长度
  }
}

export class ReactiveEffect {
  public _trackId = 0; // 每次执行id 都是+1， 如果当前同一个effect执行，id就是相同的
  public deps = []; // 存储依赖的集合
  public _depsLength = 0;
  public _running = 0 // 是否正在执行
  public active = true; // 确保effect是响应式的
  public _dirtyLevel = DirtyLevels.Dirty; // 计算属性的脏值标记，默认是脏的

  /**
   * 
   * @param fn 要执行的副作用函数
   * @param scheduler  调度函数，用于在依赖发生变化时执行
   */
  constructor(public fn, public scheduler) {
  }

  // 获取脏数据状态
  get dirty() {
    // 如果脏数据级别为Dirty，则返回true，否则返回false
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  
  // 设置dirty属性
  set dirty(value) {
    // 如果value为true，则将_dirtyLevel设置为DirtyLevels.Dirty，否则设置为DirtyLevels.NoDirty
    this._dirtyLevel = value ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }

  run() {
    this._dirtyLevel = DirtyLevels.NoDirty; // 每次执行完，都设置为NoDirty

    if (!this.active) {
      return this.fn();
    }
    let lastEfect = activeEffect;
    try {
      activeEffect = this;
      preCleanEffect(this); // 清理依赖关系，并更新依赖列表的长度
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

    // 调度队列
    // queueJob(_effect)

    // 如果当前的数据是不脏的，则重置为dirty
    if (!_effect.dirty) {
      _effect._dirtyLevel = DirtyLevels.Dirty;
    }

    // 检查当前 _effect 是否有 scheduler 属性，如果有则调用 scheduler 方法
    // console.log('触发更新');
    if (_effect.scheduler) {
      if (!_effect._running) {
        _effect.scheduler();
      }
    }
  }
}


// 调度队列，优化处理
let queues = new Set();
let isFlushing = false;
let isFlushPending = false;

function queueJob(effect) {
  queues.add(effect);

  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    Promise.resolve().then(runQueue)
  }
}

function runQueue() {
  isFlushPending = false;
  isFlushing = true;

  for (const _effect of queues) {
    if (_effect && (_effect as any).scheduler) {
      if (!(_effect as any)._running) {
        (_effect as any).scheduler();
      }
    }
  }
  queues.clear();
}