const content = "Hello world! This is a test string.";
const start1 = performance.now();
for (let i = 0; i < 100000; i++) {
  new Blob([content]).size;
}
const end1 = performance.now();
console.log(`Blob size calculation took: ${end1 - start1}ms`);

const start2 = performance.now();
// Using TextEncoder defined outside the loop
const encoder = new TextEncoder();
for (let i = 0; i < 100000; i++) {
  encoder.encode(content).length;
}
const end2 = performance.now();
console.log(`TextEncoder length calculation took: ${end2 - start2}ms`);
