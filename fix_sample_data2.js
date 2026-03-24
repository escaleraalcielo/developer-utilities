const fs = require('fs');
let code = fs.readFileSync('sample-data.js', 'utf8');
code = code.replace("module.exports = SampleData;", "module.exports = window.SampleData;");
fs.writeFileSync('sample-data.js', code);
console.log("Fixed module.exports in sample-data.js");
