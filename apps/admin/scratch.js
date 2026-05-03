const fs = require('fs');

const text = fs.readFileSync('src/app/(dashboard)/payments/page.tsx', 'utf8');
let total = 0;
let lines = text.split('\n');
for (let i=0; i<lines.length; i++) {
  let count = (lines[i].match(/`/g) || []).length;
  if (count > 0) {
    console.log(`Line ${i+1} has ${count} backticks: ${lines[i]}`);
    total += count;
  }
}
console.log('Total backticks:', total);
