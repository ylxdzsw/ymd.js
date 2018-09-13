#!/usr/bin/env node

const ymd = require("./ymd")
const fs = require("fs")

let str = ''

for (const file of [].slice.call(process.argv, 2))
    str += fs.readFileSync(file, 'utf8') + '\n\n'

console.log(ymd.render(str))
