#!/bin/bash

echo "🔧 Fixing all API endpoints..."

# Fix admin-login.html
sed -i 's|/api/admin/check|/.netlify/functions/api/admin/check|g' public/admin-login.html
sed -i 's|/api/admin/login|/.netlify/functions/api/admin/login|g' public/admin-login.html
sed -i 's|/api/admin/register|/.netlify/functions/api/admin/register|g' public/admin-login.html

# Fix admin.html
sed -i 's|/admin/history|/.netlify/functions/api/admin/history|g' public/admin.html
sed -i 's|/admin/record/|/.netlify/functions/api/admin/record/|g' public/admin.html
sed -i 's|/api/admin/logout|/.netlify/functions/api/admin/logout|g' public/admin.html

# Fix index.html - ensure no duplicates
sed -i 's|/api/check-balance|/.netlify/functions/api/check-balance|g' public/index.html
sed -i 's|/api/detect-card-type|/.netlify/functions/api/detect-card-type|g' public/index.html
sed -i 's|/.netlify/functions/.netlify/functions/|/.netlify/functions/|g' public/index.html

echo "✅ Endpoints fixed!"
