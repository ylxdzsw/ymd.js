#!/usr/bin/env node

'use strict'

function scan_definitions(str) {
    const defs = []
    str += '\n\n'

    const reg = /^\[(.*)\]([:=])([\s\S]*?\n)(?=\n|^\[.*\][:=])/gm

    while (true) {
        const token = reg.exec(str)
        if (!token) return defs

        defs.push({
            name: token[1],
            type: token[2],
            content: token[3],
            position: token.index
        })
    }
}

module.exports.render = (str, options, locals) => {

}

/*
TODO:
1. support lists
*/
