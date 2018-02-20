import chai from 'chai'
import { each } from 'lodash'
import {
  constructDecorator,
  getTargetType,
  METHOD,
  FIELD,
  CLASS
} from '../src'

const { expect } = chai

describe('decoratorUtils', () => {
  describe('#getTargetType', () => {
    const cases = [
      ['function', [() => {}], CLASS],
      ['class', [class Foo {}], CLASS],
      ['obj-str-{value: fn}', [{}, 'str', {value: () => {}}], METHOD],
      ['obj-str-obj', [{}, 'str', {}], FIELD],
      ['obj-str-null', [{}, 'str', {}], FIELD],
      ['null', [null], null]
    ]

    each(cases, ([title, args, expected]) => {
      it(`detects ${title} as ${expected}`, () => {
        expect(getTargetType.apply(null, args)).to.equal(expected)
      })
    })
  })

  describe('#constructDecorator', () => {
    it('returns fn', () => {
      const decorator = constructDecorator(() => {})
      expect(decorator).to.be.a('function')
    })

    it('throws error if handler is not a func', () => {
      expect(() => { constructDecorator({}) }).to.throw(Error)
    })
  })

  describe('decorator', () => {
    describe('for constructor', () => {
      it('extends target class', () => {
        const decorator = constructDecorator((targetType, target) => {
          if (targetType === CLASS) {
            return class Bar extends target {
              constructor (name, age) {
                super(name)
                this.age = age
              }
            }
          }
        })

        @decorator()
        class Foo {
          constructor (name) {
            this.name = name
          }
          foo () { return 'bar' }
        }

        const foo = new Foo('qux', 100)
        expect(foo.constructor).to.equal(Foo)
        expect(foo.age).to.equal(100)
        expect(foo.foo()).to.equal('bar')
      })

      it('overrides proto', () => {
        const decorator = constructDecorator((targetType, target) => {
          if (targetType === METHOD) {
            return () => {
              return target().toUpperCase()
            }
          }
        })

        @decorator()
        class Foo {
          foo () { return 'bar' }
          baz () { return 'baz' }
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo()).to.equal('BAR')
        expect(foo.baz()).to.equal('BAZ')
      })

      it('has no effect if handler returns null', () => {
        const decorator = constructDecorator(() => {})

        @decorator()
        class Foo {
          foo () { return 'bar' }
          baz () { return 'baz' }
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo()).to.equal('bar')
        expect(foo.baz()).to.equal('baz')
      })
    })

    describe('for method', () => {
      it('replaces target with the new impl', () => {
        const decorator = constructDecorator((targetType, target, param) => {
          if (targetType === METHOD) {
            return value => param || 'qux'
          }
        })

        class Foo {
          @decorator()
          foo () { return 'bar' }
          @decorator('BAZ')
          baz () { return 'baz' }
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo()).to.equal('qux')
        expect(foo.baz()).to.equal('BAZ')
      })

      it('has no effect if handler returns null', () => {
        const decorator = constructDecorator(() => {})

        class Foo {
          @decorator('abc')
          foo () { return 'bar' }
          @decorator('BAZ')
          baz () { return 'baz' }
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo()).to.equal('bar')
        expect(foo.baz()).to.equal('baz')
      })
    })

    describe('for field', () => {
      it('replaces target initializer', () => {
        const prefix = constructDecorator((targetType, target, param) => {
          if (targetType === FIELD) {
            return () => (param || '') + target()
          }
        })

        class Foo {
          @prefix('_')
          foo = 'bar'
          @prefix('__')
          baz = 'qux'
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo).to.equal('_bar')
        expect(foo.baz).to.equal('__qux')
      })

      it('has no effect if handler returns null', () => {
        const decorator = constructDecorator(() => {})

        class Foo {
          @decorator('abc')
          foo = 'bar'
          @decorator('BAZ')
          baz = 'qux'
        }

        const foo = new Foo()
        expect(foo.constructor).to.equal(Foo)
        expect(foo.foo).to.equal('bar')
        expect(foo.baz).to.equal('qux')
      })
    })
  })
})
