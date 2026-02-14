# Issues - Pending Items

## Pending

- **NBG Portal DOM structure changes**: The scraper relies on specific DOM selectors (`a[href*="/apiProduct/"]`, `li a` for pagination, `h3` for names, `span` for status badges). If the NBG Developer Portal redesigns its page, these selectors will need updating.

- **Cookie consent dialog variability**: The cookie acceptance step searches for buttons with text "accept", "accept all", or "agree". If the portal changes its consent mechanism, this step may need adjustment.

## Completed

_No completed items yet._
