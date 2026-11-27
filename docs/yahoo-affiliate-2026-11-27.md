# Yahoo affiliate tracking — 2026-11-27

ValueCommerce program 2025875 (Yahoo!ショッピング) was applied for with user approval. Both sites displayed 提携済み after submission.

Official MyLink material 2840499 generated these site-specific public tracking pairs:

| Site | SID | PID |
| --- | --- | --- |
| MyBagPro | 3789994 | 892759777 |
| Golf ID | 3789995 | 892759779 |

The generated link format is `//ck.jp.ap.valuecommerce.com/servlet/referral?sid=...&pid=...&vc_url=...`. Implementation uses explicit HTTPS and preserves encoded search destinations. The previous pair belonged to the funrecipe site and is replaced for these hosts.

## Validation and release status

- `src/utils/affiliate.ts` selects the Golf ID pair for golfid.jp and www.golfid.jp; other hosts use the MyBagPro pair.
- Both canonical and www hostnames passed checks for SID, PID, HTTPS and Japanese/special-character search-query round trips.
- TypeScript and production build passed. CSS output remains main-BFFCAWry.css. No layout components were edited.
- Prebuild-generated content changes were restored to avoid including unrelated data updates.
- Local browser preview blocked: listen EPERM on 127.0.0.1:5173. Visual QA has not been completed.
- Not committed, pushed or deployed. Public sites still use the previous implementation.
- Next: preview visual QA, capture the current production rollback target, then publish this single-file implementation change and verify rendered Yahoo links separately on both domains without generating artificial affiliate clicks.
- Issuing a link and confirming partnership do not verify actual order attribution; check site-specific reports after real customer activity.
