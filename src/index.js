// @flow

import { isFunction, isUndefined, mapValues, getPrototypeMethods } from './utils'
import type { IDecorator } from './interface'

export const METHOD = 'method'
export const CLASS = 'class'
export const FIELD = 'field'

export const targets = { METHOD, CLASS, FIELD }

/**
 * Constructs decorator by given function.
 * Holywar goes here: https://github.com/wycats/javascript-decorators/issues/23
 * @param {Function} handler
 * @returns {function(...[any])}
 */
export function constructDecorator (handler: Function): IDecorator {
  if (!isFunction(handler)) {
    throw new Error('Decorator handler must be a function')
  }

  return (...args: any) => (target: any, method: ?string, descriptor: ?Object) => {
    const targetType = getTargetType(target, method, descriptor)
    const _handler = (targetType, value) => {
      const _value = handler(targetType, value, ...args)

      return isUndefined(_value) ? value : _value
    }
    switch (targetType) {
      case null:
      default:
        return

      case FIELD:
        // $FlowFixMe
        descriptor.initializer = _handler(targetType, descriptor.initializer)

        return

      case METHOD:
        // $FlowFixMe
        descriptor.value = _handler(targetType, descriptor.value)
        return

      case CLASS:
        Object.defineProperties(target.prototype, mapValues(getPrototypeMethods(target), (desc, name) => {
          desc.value = _handler(METHOD, desc.value)
          return desc
        }))

        return _handler(CLASS, target)
    }
  }
}

/**
 * Detects decorated target type.
 * @param {*} target
 * @param {string} [method]
 * @param {Object} [descriptor]
 * @returns {*}
 */
export function getTargetType (target: any, method: ?string, descriptor: ?Object) {
  if (method && descriptor) {
    return isFunction(descriptor.value) ? METHOD : FIELD
  }

  return isFunction(target) ? CLASS : null
}
