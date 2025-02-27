import { activeEffect } from "./effect"

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive'
}

export const reactiveMap = new WeakMap() 

export const mutableHandlers: ProxyHandler<any> = {
  get(target, property, receiver) {
    if (property === ReactiveFlags.IS_REACTIVE) {
      return true
    }

    console.log(activeEffect, property)

    // 使用proxy的时候搭配Reflect来使用，解决this问题
    // 取值的时候让这个属性和effect产生关系
    return Reflect.get(target, property, receiver)
  },
  set(target, property, value, receiver) {
    // 更新数据
    return Reflect.set(target, property, value, receiver)
  }
}