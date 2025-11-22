#!/bin/bash

echo "🚀 Starting SeaCheck Netlify deployment fixes..."
echo "📝 Current directory: $(pwd)"
echo "📁 Files in current directory:"
ls -la

echo ""
echo "📝 Updating HTML files with correct API endpoints..."

# Check if files exist before updating
if [ -f "public/admin-login.html" ]; then
    echo "✅ Updating admin-login.html"
    sed -i 's|/api/admin/check|/.netlify/functions/api/admin/check|g' public/admin-login.html
    sed -i 's|/api/admin/login|/.netlify/functions/api/admin/login|g' public/admin-login.html
    sed -i 's|/api/admin/register|/.netlify/functions/api/admin/register|g' public/admin-login.html
else
    echo "❌ admin-login.html not found in public directory"
fi

if [ -f "public/admin.html" ]; then
    echo "✅ Updating admin.html"
    sed -i 's|/admin/history|/.netlify/functions/api/admin/history|g' public/admin.html
    sed -i 's|/admin/record/|/.netlify/functions/api/admin/record/|g' public/admin.html
    sed -i 's|/api/admin/logout|/.netlify/functions/api/admin/logout|g' public/admin.html
else
    echo "❌ admin.html not found in public directory"
fi

if [ -f "public/index.html" ]; then
    echo "✅ Updating index.html"
    sed -i 's|/api/check-balance|/.netlify/functions/api/check-balance|g' public/index.html
    sed -i 's|/api/detect-card-type|/.netlify/functions/api/detect-card-type|g' public/index.html
else
    echo "❌ index.html not found in public directory"
fi

echo ""
echo "🎉 Deployment fixes completed!"

echo ""
echo "Next steps:"
echo "1. Run: git add ."
echo "2. Run: git commit -m 'Fix Netlify deployment'"
echo "3. Run: git push origin main"
echo "4. Deploy to Netlify with environment variables:"
echo "   - MONGODB_URI: mongodb+srv://mhmmdsalaudeen_db_user:MohtechPro123@seacheck.dw4zvlc.mongodb.net/?appName=Seacheck
echo "   - SESSION_SECRET: seacheck-tech-magnet-studio-2025-secret"
