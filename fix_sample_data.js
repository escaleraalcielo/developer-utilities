const fs = require('fs');
let code = fs.readFileSync('sample-data.js', 'utf8');
code = code.replace("const SampleData = {", "window.SampleData = {");
fs.writeFileSync('sample-data.js', code);
console.log("Fixed sample-data.js");
