#!/usr/bin/env bash
# install-cron.sh — Install all scheduled tasks
# Run once: bash scripts/install-cron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

chmod +x "$SCRIPT_DIR/daily-inbox.sh"
chmod +x "$SCRIPT_DIR/ai-trend-report.sh"
chmod +x "$SCRIPT_DIR/team-report.sh"

# Remove existing linkedin-stack cron entries
EXISTING=$(crontab -l 2>/dev/null | grep -v "linkedin-stack" || true)

NEW_CRON="$EXISTING
# linkedin-stack — Daily inbox organisation at 7am
0 7 * * * $SCRIPT_DIR/daily-inbox.sh >> $SCRIPT_DIR/../logs/cron.log 2>&1
# linkedin-stack — AI trend report at 7am
0 7 * * * $SCRIPT_DIR/ai-trend-report.sh >> $SCRIPT_DIR/../logs/cron.log 2>&1
# linkedin-stack — Team report at 5pm
0 17 * * * $SCRIPT_DIR/team-report.sh >> $SCRIPT_DIR/../logs/cron.log 2>&1
"

echo "$NEW_CRON" | crontab -

echo "Cron jobs installed:"
crontab -l | grep "linkedin-stack" -A 1
echo ""
echo "Done. Logs will appear in: $SCRIPT_DIR/../logs/"
