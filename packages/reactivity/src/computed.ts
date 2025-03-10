import { isFunction } from "../../shared/src";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";


class ComputedRefImpl {
  public _value;
  public effect;
  public dep;
  constructor(getter, public setter) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        triggerRefValue(this)
      })
  }
  get value() {
    // 判断此计算属性是否是脏的，如果是脏的，则重新计算
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
    }
    console.log('取缓存')
    return this._value
  }
  set value(val) {
    this.setter(val)
  }
}

export function computed(getterOrOptions) {
  let getter, setter;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => { }
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter)
}