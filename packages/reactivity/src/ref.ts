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

export function proxyRefs(objectWidthRef) {
  return new Proxy(objectWidthRef, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver)
      return r.__v_ifRef ? r.value : r
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      if (oldValue.__v_ifRef) {
        oldValue.value = value;
        return true;
      }
      return Reflect.set(target, key, value, receiver)
    }
  })
}