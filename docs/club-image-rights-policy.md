# Club Image Rights Policy

MyBagPro stores club model data from 2006 onward, but does not copy images unless usage rights are clear.

## Display Priority

1. `club_images.is_primary = true` and `is_verified = true`
2. `license_status` is `permitted`, `affiliate_allowed`, `own`, or `licensed`
3. External image URLs with unclear rights may be stored as metadata, but should not be promoted as primary production images
4. No image: show a clean placeholder with brand/model/category

## Required Metadata

Every image record must keep:

- `source_url`
- `source_type`
- `license_status`
- `credit`
- `copyright_notice`
- `is_verified`
- `verified_at`

## Do Not Do

- Do not download Google Image Search results.
- Do not copy manufacturer images into storage without permission.
- Do not mark `license_status = unknown` as a primary production image.
- Do not invent license or credit values.

## Allowed Sources

- Own photos
- Licensed images
- Official press kit images where terms are confirmed
- Affiliate/API product images where display is allowed by the API terms
- Manual uploads with recorded permission
