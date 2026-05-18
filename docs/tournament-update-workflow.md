# Tournament Update Workflow

This is the weekly workflow for turning tournament results into MyBagPro profile pages, WITB updates, and result articles.

## Goal

Keep tournament-top-player content current without publishing unverified club settings.

Every finished tournament should become one of these outcomes:

- Existing profile updated when a confirmed WITB source is available
- New profile created when a confirmed WITB source is available
- Tournament article updated as "tracking" when no confirmed WITB source is available
- Sitemap and fallback data regenerated and deployed

## Weekly Steps

1. Copy the intake template:

```bash
cp docs/tournament-update-intake.template.json docs/tournament-update-intake-YYYY-MM-DD.json
```

2. Fill in each finished tournament.

Include at least:

- tourKey
- tournament name
- event dates
- result source URL
- top 3 finishers
- confirmed WITB sources if they exist

3. Generate the action plan:

```bash
npm run content:plan-tournament-updates -- docs/tournament-update-intake-YYYY-MM-DD.json
```

4. Open the generated report in `docs/tournament-update-reports/`.

Use the Player Queue to decide:

- `ページ作成`: create a new `docs/<slug>-seed.json`
- `既存ページ更新確認`: compare confirmed WITB source with existing seed file
- `WITBソース調査`: search again, but do not invent club data
- `監視継続`: leave the tournament article as a tracking note

5. Upsert changed profiles and articles:

```bash
npm run supabase:upsert-setting-profile -- docs/<slug>-seed.json
npm run supabase:upsert-articles -- docs/<tournament-result-file>.json
```

6. Build and deploy:

```bash
npm run build
git add docs public src scripts package.json
git commit -m "Update tournament setting coverage"
git push
vercel --prod --yes
```

7. Search Console:

- Submit `https://www.mybagpro.jp/sitemap.xml`
- Request indexing for new `/pros/<slug>` pages
- Request indexing for new `/articles/<slug>` pages

## Source Rules

Confirmed WITB sources:

- Manufacturer official pages
- Tour official pages with equipment data
- GDO, ALBA, Golf Monthly, Today's Golfer, GolfWRX, Golf Digest, PGA TOUR, LPGA, JGTO, JLPGA
- Player/team official media when club models are visible or explicitly listed

Not enough by itself:

- Leaderboard only
- Instagram photo where model cannot be confirmed
- Fan comments
- Old WITB with no date and no supporting source
- AI-generated summaries without original source links

## Article Rules

If top finishers have confirmed WITB:

- Link to their `/pros/<slug>` page
- Explain what amateurs can learn from the setup
- Warn against copying tour shafts/specs directly

If top finishers do not have confirmed WITB:

- Write the result article as a tracking/update article
- Name the players and result
- Say MyBagPro will update when official or reputable WITB sources appear
- Do not list guessed clubs

## SEO Checklist

For each new profile page:

- Title should include `選手名 クラブセッティング 年`
- Description should include driver, irons, wedges, putter, ball
- `docs/<slug>-seed.json` should have source URLs and `verified_at`
- Page should appear in `public/sitemap.xml`
- Page should be requested in Search Console

For each result article:

- Title should include tournament name, year, result, and club-setting angle
- Body should link naturally to relevant profiles
- Image should be golf/tournament/club relevant
- Article should appear in `public/sitemap.xml`
