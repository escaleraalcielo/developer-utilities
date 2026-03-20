const { performance } = require('perf_hooks');

const items = Array.from({ length: 1000000 }, (_, i) => `item${i}`);
const delim = ',';
const quoteType = 'single';

// Baseline
function runBaseline() {
    let processedItems = [...items];
    const itemsForValidation = [...processedItems];

    if (quoteType === 'single') {
        processedItems = processedItems.map(item => `'${item}'`);
    } else if (quoteType === 'double') {
        processedItems = processedItems.map(item => `"${item}"`);
    }
    let result = processedItems.join(delim);
    return { resultLength: result.length, valLength: itemsForValidation.length };
}

// Optimized
function runOptimized() {
    let processedItems = [...items]; // to match initial state

    // Store items for validation
    const itemsForValidation = processedItems;

    let result = "";
    if (processedItems.length > 0) {
        if (quoteType === 'single') {
            result = `'${processedItems.join(`'${delim}'`)}'`;
        } else if (quoteType === 'double') {
            result = `"${processedItems.join(`"${delim}"`)}"`;
        } else {
            result = processedItems.join(delim);
        }
    }
    return { resultLength: result.length, valLength: itemsForValidation.length };
}

// Warmup
runBaseline();
runOptimized();

const ITERATIONS = 50;

let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    runBaseline();
}
const baselineTime = performance.now() - start;

start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    runOptimized();
}
const optimizedTime = performance.now() - start;

console.log(`Baseline: ${baselineTime.toFixed(2)}ms`);
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);
