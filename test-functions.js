// Test script to verify function endpoints
const testEndpoints = [
  '/.netlify/functions/api/detect-card-type',
  '/.netlify/functions/api/check-balance',
  '/.netlify/functions/api/admin/check'
];

console.log('🧪 Test these endpoints in your browser:');
testEndpoints.forEach(endpoint => {
  console.log(`   https://your-app.netlify.app${endpoint}`);
});

console.log('\n📝 For POST endpoints, use curl or Postman to test:');
console.log('   curl -X POST https://your-app.netlify.app/.netlify/functions/api/detect-card-type \\');
console.log('        -H "Content-Type: application/json" \\');
console.log('        -d \'{"code":"TEST123456789012"}\'');
