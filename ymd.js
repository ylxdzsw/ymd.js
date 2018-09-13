#!/usr/bin/env node

'use strict'

const vm = require("vm")

function replace_substr(str, start, end, func=x=>'') {
    return str.substring(0, start) + func(str.substring(start, end)) + str.substring(end)
}

function next_match(str, reg, i=0) {
    reg.lastIndex = i
    return reg.exec(str)
}

function append_empty(defs, name) {
    return [{ name: '', type: ':', content: name, position: Infinity }].concat(defs)
}

function scan_definitions(str) {
    const defs = []
    str += '\n\n'

    const reg = /^\[(.*?)\]([:=])([\s\S]*?\n)(?=\n|^\[.*?\][:=])/gm

    while (true) {
        const token = reg.exec(str)
        if (!token) return { remaining: str, defs }

        str = replace_substr(str, token.index, reg.lastIndex)
        reg.lastIndex = token.index

        defs.push({
            name: token[1],
            type: token[2],
            content: token[3],
            position: token.index
        })
    }
}

function interpret(state, env, name, defs) {
    function interp_refer(def) {
        state.result += interpret_all(def.content, append_empty(defs, name))
    }

    function interp_script(def) {
        env.state = state
        env.interpret = str => interpret_all(str, env, defs)
        state.result += vm.runInContext(def.content, env)
    }

    const def = defs.find(x=>x.name == name)
    if (def) {
        def.type == ':' ? interp_refer(def)
                        : interp_script(def)
        return state
    } else {
        throw new ReferenceError("no such macro: " + name)
    }
}

function interpret_all(str, env, defs) {
    const reg = /\[(.*?)\]/g

    const state = { str, i: 0, result: '' }
    while (true) {
        const token = next_match(state.str, reg, state.i)
        if (token) {
            state.result += str.substring(state.i, token.index)
            state.i = reg.lastIndex
            interpret(state, env, token[1], defs.filter(x => x.position > state.i))
        } else {
            return state.result + str.substring(state.i)
        }
    }
}

const helpers = {
    capture_block() {
        const i = next_match(this.state.str, /^(\[(.*?)\]([:=])|\n)/gm, this.state.i).index
        const content = this.state.str.substring(this.state.i, i)
        this.state.i = i
        return content
    },
    capture_until(delimiter) {
        const i = this.state.str.indexOf(delimiter, this.state.i)
        if (i == -1) throw new RangeError("string ends without seeing delimiter " + delimiter)
        const content = this.state.str.substring(this.state.i, i)
        this.state.i = i + delimiter.length
        return content
    },
    capture_line() {
        return this.capture_until('\n')
    }
}

module.exports.render = (str, options={}, locals={}) => {
    const env = vm.createContext(locals)
    for (const k in helpers) {
        env[k] = helpers[k].bind(env)
    }
    const { remaining, defs } = scan_definitions(str)
    return interpret_all(remaining, env, defs)
}

/*
TODO:
1. support lists
    - lists can be nested, possibly using indents
    - use - to start an unordered list and * to start an ordered list
    - lists should terminate block like defs
2. handle empty brackets []
    - it refers to the current macro name when inside a definition
3. currently references can be recursive, should we track them and throw?
4. add offset option so macros refers to the correct definitions inside "capture_until"
*/
