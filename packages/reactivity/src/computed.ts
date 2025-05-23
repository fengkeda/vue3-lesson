import { isFunction } from "../../shared/src";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";


class ComputedRefImpl {
  public _value;
  public effect;
  public dep;
  constructor(getter, public setter) {
    // 生成一个effect, 执行函数是getter
    this.effect = new ReactiveEffect(
      () => {
        console.log('执行了computed的effect');
        return getter(this._value)
      },
      () => {
        triggerRefValue(this)
      })
  }
  get value() {
    // 判断此计算属性是否是脏的，如果是脏的，则重新计算
    if (this.effect.dirty) {
      console.log('更新值')
      this._value = this.effect.run(); // 执行effect的getter，获取最新值并让依赖数据收集computed的effect
      trackRefValue(this); // 如果在别的effect访问了计算属性，则收集effect到计算属性的dep中
    } else {
      console.log('取缓存')
    }
    return this._value
  }
  set value(val) {
    this.setter(val)
  }
}

// 导出一个函数，用于计算属性
export function computed(getterOrOptions) {
  // 定义getter和setter变量
  let getter, setter;

  // 如果getterOrOptions是一个函数，则将其赋值给getter，并将setter赋值为一个空函数
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => { }
  } else {
    // 否则，将getterOrOptions.get赋值给getter，将getterOrOptions.set赋值给setter
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  // 返回一个新的ComputedRefImpl实例，传入getter和setter
  return new ComputedRefImpl(getter, setter)
}