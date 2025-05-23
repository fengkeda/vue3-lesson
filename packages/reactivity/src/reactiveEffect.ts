import { activeEffect, trackEffect, triggerEffects } from "./effect";

export const createDep = (cleanup, key) => {
  const dep: any = new Map();
  dep.cleanup = cleanup;
  dep.name = key;

  return dep;
}

const targetMap = new WeakMap()

// 导出一个名为 track 的函数，用于追踪依赖
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))
    }

    trackEffect(activeEffect, dep)
  }
}

export function trigger(target, key, value, oldValue) {

  let depsMap = targetMap.get(target); // 获取到对应的effect

  if (!depsMap) return;

  let dep = depsMap.get(key);

  if (dep) {
    triggerEffects(dep)
  }
}


