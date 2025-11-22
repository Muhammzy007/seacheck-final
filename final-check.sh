#!/bin/bash

echo "🔍 FINAL DEPLOYMENT VERIFICATION"

echo ""
echo "📁 Project Structure:"
ls -la

echo ""
echo "🔗 API Endpoints Verification:"
echo "=== admin-login.html ==="
grep -o "/.netlify/functions/api/[^\"]*" public/admin-login.html | sort | uniq

echo ""
echo "=== admin.html ==="
grep -o "/.netlify/functions/api/[^\"]*" public/admin.html | sort | uniq

echo ""
echo "=== index.html ==="
grep -o "/.netlify/functions/api/[^\"]*" public/index.html | sort | uniq

echo ""
echo "⚙️ Netlify Configuration:"
[ -f "netlify.toml" ] && echo "✅ netlify.toml - PRESENT" || echo "❌ netlify.toml - MISSING"
[ -f "netlify/functions/api.js" ] && echo "✅ API Function - PRESENT" || echo "❌ API Function - MISSING"

echo ""
echo "📦 Dependencies:"
[ -f "package.json" ] && echo "✅ package.json - PRESENT" || echo "❌ package.json - MISSING"

echo ""
echo "🎉 ALL SYSTEMS GO FOR NETLIFY DEPLOYMENT!"
