import { activeEffect, trackEffect, triggerEffects } from "./effect";

export const createDep = (cleanup, key) => {
  const dep: any = new Map();
  dep.cleanup = cleanup;
  dep.name = key;

  return dep;
}

const targetsMap = new WeakMap()

// 导出一个名为 track 的函数，用于追踪依赖
export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetsMap.get(target)

    if (!depsMap) {
      targetsMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)))
    }

    trackEffect(activeEffect, dep)

    // console.log(targetsMap);

  }
}

export function trigger(target, key, value, oldValue) {

  let depsMap = targetsMap.get(target); // 获取到对应的effect

  if(!depsMap) return;

  let dep = depsMap.get(key);

  if (dep) {
    triggerEffects(dep)
  }
}


