import { track, trigger } from "./reactiveEffect";
import { isObject } from "@vue/shared";
import { reactive } from './reactive'
import { ReactiveFlags } from "./constants";

export const reactiveMap = new WeakMap()

export const mutableHandlers: ProxyHandler<any> = {
  get(target, property, receiver) {
    if (property === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    track(target, property)

    // 使用proxy的时候搭配Reflect来使用，解决this问题
    // 取值的时候让这个属性和effect产生关系
    let res = Reflect.get(target, property, receiver);
    
    if (isObject(res)) return reactive(res);

    return res;
  },
  set(target, property, value, receiver) {

    let oldValue = target[property];

    // 更新数据
    let result = Reflect.set(target, property, value, receiver);

    if (oldValue !== value) {
      trigger(target, property, value, oldValue)
    }

    return result
  }
}