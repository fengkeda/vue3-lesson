import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags, reactiveMap } from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target)
}

function createReactiveObject(target) {
  // 必须是对象
  if (!isObject(target)) return target;

  // 已经是响应式对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    console.log('已经是响应式对象');
    return target;
  }

  // 有代理过，从缓存里拿取
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    console.log('已经代理过');
    return existingProxy;
  }

  const proxy = new Proxy(target, mutableHandlers)
  // 缓存
  reactiveMap.set(target, proxy)

  return proxy;
}

export function toReactive(target) {
  return isObject(target) ? reactive(target) : target;
}