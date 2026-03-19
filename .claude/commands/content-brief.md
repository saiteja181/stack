# Content Brief — Daily AI Trend Report

## Goal
Generate a ready-to-post LinkedIn content brief based on today's trending AI topics.

## Steps

1. **Source trending topics** from:
   - LinkedIn trending hashtags in AI/tech
   - Recent AI news (last 24–48 hours)
   - Industry newsletters and product launches

2. **Select the strongest hook topic** — something surprising, contrarian, or highly timely

3. **Write the LinkedIn post** in this format:
   - **Hook** (1–2 lines, stops the scroll)
   - **Insight 1** — What's happening
   - **Insight 2** — Why it matters
   - **Insight 3** — What to do about it
   - **Takeaway + CTA** (ask a question or invite a comment)

4. **Check constraints**:
   - Under 1300 characters total
   - Line break every 2–3 sentences
   - No corporate jargon
   - Mobile-readable

5. **Output a second variant** — slightly different angle or hook, for A/B testing

## Output Format

```
[PRIMARY POST]
<hook>

<insight 1>

<insight 2>

<insight 3>

<takeaway + CTA>

---
Character count: XXX / 1300

[VARIANT POST]
<alternative version>

---
Character count: XXX / 1300
```

## Usage
Run with no arguments for today's trends, or pass a topic:
Example: `/content-brief Topic: AI agents replacing junior developers`
