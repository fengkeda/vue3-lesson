export let activeEffect = undefined;

export class ReactiveEffect {
  constructor(public fn, public scheduler) {
  }

  run() {
    try {
      activeEffect = this;
      return this.fn();
    }
    finally {
      activeEffect = undefined
    }
  }
}

export function effect(fn) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
}