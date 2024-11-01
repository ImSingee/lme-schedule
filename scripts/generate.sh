set -eo pipefail

DATE=$1

if [ -z "$DATE" ]; then
    echo "Usage: $0 <date>"
    echo "    Date format: YYYY-MM"
    exit 1
fi

deno run -A scripts/generate-events.ts data/$DATE.json > events/$DATE.json
deno run -A scripts/generate-ics.ts events/$DATE.json > ics/$DATE.ics