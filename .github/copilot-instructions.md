# MyBagPro Copilot Instructions

You are assisting with development of MyBagPro.

## Project
- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Vercel

## Product Context
MyBagPro is a golf web app for:
- pro club settings
- golf club diagnosis
- My Bag management
- comparison flows
- articles/content
- affiliate purchase flows

## Priorities
- Preserve the existing design direction and brand tone
- Mobile-first UI adjustments
- Do not break diagnosis, compare, My Bag, or save flows
- Keep edits minimal and consistent with existing code
- Reuse existing components and helpers when possible

## Data / Domain Rules
- Never invent non-existent club models or shaft names
- Use real, current club/shaft/ball names only
- Player images continue to use the existing Instagram image flow
- Affiliate links are handled via src/utils/affiliate.ts
- Club image handling should remain easy to connect to Rakuten API later

## Rakuten API Integration
- Application ID and Affiliate ID are set in environment variables
- Use `src/utils/rakutenApi.ts` for product search and image fetching
- Keep affiliate flow intact while integrating dynamic club images
- Player images remain on the existing Instagram flow

## Code Rules
- Do not perform large refactors unless explicitly requested
- Keep TypeScript types valid
- Avoid unnecessary abstraction
- Follow existing component structure and naming patterns
- Prefer editing current files over introducing new architecture
- Be careful with Supabase persistence logic
- Understand both localStorage and Supabase save flows before changing save behavior

## UI Rules
- Prioritize smartphone usability
- Maintain spacing, rounded corners, and CTA hierarchy
- Avoid making pages longer than necessary
- Keep actions obvious and easy to tap on mobile

## Response Style
When suggesting edits:
1. Briefly explain what will change
2. Show file-by-file changes
3. Mention any assumptions
4. Mention what should be checked after the change
