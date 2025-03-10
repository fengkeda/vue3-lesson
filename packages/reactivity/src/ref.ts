import { isObject } from "../../shared/src";
import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { toReactive } from "./reactive";
import { createDep } from "./reactiveEffect";

export function ref(target) {
  return createRef(target)
}

export function createRef(value) {
  return new RefImp(value);
}

class RefImp {
  public __v_isRef = true;
  public _value;
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

  get() {
    trackRefValue(this)
    return this._value;
  }
  set(newValue) {
    if (newValue !== this.rawValue) {

      triggerRefValue(this)

      this.rawValue = newValue;
      this._value = newValue;
    }
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    trackEffect(activeEffect, (ref.dep = createDep(() => (ref.dep = undefined), 'undefined')))
  }
}

export function triggerRefValue(ref) {
  let dep = ref.dep;

  if (dep) triggerEffects(dep)
}

class ObjectRefImp {
  public __v_ifRef = true;
  constructor(public _object, public _key) {
  }

  get value() {
    return this._object[this._key];
  }

  set value(newValue) {
    this._object[this._key] = newValue;
  }
}

export function toRef(object, key) {
  return new ObjectRefImp(object, key);
}

export type ToRefs<T = any> = {
  [K in keyof T]: any
}

export function toRefs<T extends object>(object: T): ToRefs<T> {
  if (!isObject(object)) {
    throw new Error('toRefs can only be called with an object');
  }

  const res = {} as any;

  for (let key in object) {
    res[key] = toRef(object, key);
  }

  return res;
}

// ref自动解包
export function proxyRefs(objectWidthRef) {
  // 返回一个新的 Proxy 对象，用于代理传入的对象引用
  return new Proxy(objectWidthRef, {
    // 定义 Proxy 对象的 get 捕捉器，用于处理对目标对象的属性访问
    get(target, key, receiver) {
      // 使用 Reflect.get 方法获取目标对象上的属性值
      let r = Reflect.get(target, key, receiver)
      // 检查获取的属性值是否为引用类型（通过检查 __v_ifRef 标识）
      return r.__v_ifRef ? r.value : r
      // 如果是引用类型，则返回其 value 属性；否则直接返回属性值
    },
    // 定义 Proxy 对象的 set 捕捉器，用于处理对目标对象的属性赋值
    set(target, key, value, receiver) {
      // 获取目标对象上当前属性的旧值
      let oldValue = target[key];
      // 检查旧值是否为引用类型（通过检查 __v_ifRef 标识）
      if (oldValue.__v_ifRef) {
        // 如果是引用类型，则将新值赋给旧值的 value 属性
        oldValue.value = value;
        // 返回 true 表示赋值成功
        return true;
      }
      return Reflect.set(target, key, value, receiver)
    }
  })
}

export function isRef(value) {
  return value && value.__v_isRef;
}