# LinkedIn Outreach — Personalized Connection + Follow-up Sequence

## Goal
Research the lead and generate a full Day 1 → Day 3 → Day 7 → Day 14 outreach sequence.

## Steps

1. **Research the lead** using their name and company provided by the user:
   - Recent LinkedIn posts (themes, topics, tone)
   - Job title and any recent promotions or company news
   - Shared connections or mutual interests

2. **Write Day 1 — Connection Request Note** (max 300 characters):
   - Reference something specific (post, job change, company milestone)
   - No pitch — just genuine curiosity or shared interest

3. **Write Day 3 — Value-First Message** (after connection accepted):
   - Lead with a useful insight, resource, or article relevant to their role
   - No ask — purely give value

4. **Write Day 7 — Soft Ask**:
   - Reference the value shared on Day 3
   - Offer a call, demo, or resource
   - Single clear CTA

5. **Write Day 14 — Final Follow-up**:
   - Keep the door open
   - Zero pressure
   - Leave on a positive note

## Output Format

Return each message clearly labelled:
```
[DAY 1 - CONNECTION REQUEST]
<message under 300 chars>

[DAY 3 - VALUE MESSAGE]
<message>

[DAY 7 - SOFT ASK]
<message>

[DAY 14 - FINAL FOLLOW-UP]
<message>
```

## Usage
Provide the lead's name, company, and any context you have about them.
Example: `/linkedin-outreach Name: Sarah Chen | Company: Notion | Context: She posted about async work culture last week`
