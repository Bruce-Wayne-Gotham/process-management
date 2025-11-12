#!/bin/sh

echo "🐳 Tobacco Tracker Database Setup Container"
echo "==========================================="
echo ""

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   Please set SUPABASE_URL and SUPABASE_KEY"
    echo ""
    echo "Example:"
    echo "   docker run -e SUPABASE_URL=your_url -e SUPABASE_KEY=your_key tobacco-tracker-setup"
    exit 1
fi

echo "🔗 Supabase URL: $SUPABASE_URL"
echo "🔑 Supabase Key: ${SUPABASE_KEY:0:20}..."
echo ""

# Run the database setup
node setup-database.js

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Container setup completed successfully!"
    echo "🎯 Your database is ready for the Tobacco Tracker application"
else
    echo ""
    echo "❌ Container setup failed!"
    exit 1
fi
