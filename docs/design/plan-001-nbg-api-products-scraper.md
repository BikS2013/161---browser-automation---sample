# Plan: NBG Developer Portal API Products Scraper Tool

## Context

During a live browser session, we navigated developer.nbg.gr and manually iterated through 7 pages of API Products, collecting 31 APIs across pages 1-5 (pages 6-7 were empty). The user now wants this flow automated as a reusable TypeScript CLI tool.

## What Was Created

A TypeScript CLI tool at `tools/nbg-api-products/` that uses `agent-browser` to scrape the NBG Developer Portal API Products listing automatically.

## File Structure

```
161 - browser automation/
├── CLAUDE.md                          # Updated with tool documentation
├── Issues - Pending Items.md          # Per project rules
├── tools/
│   └── nbg-api-products/
│       ├── src/
│       │   └── index.ts               # Main implementation
│       ├── package.json               # tsx, typescript devDeps
│       └── tsconfig.json              # ES2022, NodeNext
└── docs/
    └── design/
        └── plan-001-nbg-api-products-scraper.md
```

## Implementation Details

### Core Class: `NbgApiProductsScraper`

Follows the same pattern as the Appian tool at `175 - Appian Automation 01/tools/appian-expression-rule/src/index.ts`:

- **`executeCommand(cmd)`** - Wraps `agent-browser --session <name> [--headed] <cmd>` via `execSync`
- **`parseSnapshot(output)`** - Parses accessibility tree lines into typed elements
- **`openSite()`** - `open https://developer.nbg.gr`
- **`acceptCookies()`** - Snapshot, find Accept button, click it (graceful if not found)
- **`navigateToApiProducts()`** - Click "API PRODUCTS" link via ref, fallback to direct URL
- **`extractProductsFromPage(pageNum)`** - Uses `eval` to run JS in browser that queries `a[href*="/apiProduct/"]` elements and extracts name, status, slug
- **`detectTotalPages()`** - Uses `eval` to read pagination link numbers
- **`navigateToNextPage()`** - Uses `eval` to click NEXT link (proven reliable in live session; `click "NEXT"` failed)
- **`scrapeAllPages()`** - Loop: extract products, click NEXT, repeat until no more pages or empty page
- **`closeBrowser()`** - Close session
- **`run()`** - Orchestrates full flow, formats output, writes file if requested

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--headless` | off (headed) | Run browser headlessly |
| `--json` | off | Output as JSON |
| `-o, --output <file>` | none | Write output to file |
| `-v, --verbose` | off | Show progress messages |
| `--max-pages <n>` | 10 | Max pages to iterate |
| `--no-stop-empty` | off | Don't stop on empty pages |
| `-h, --help` | -- | Show help |

### Output Formats

**Human-readable (default):** Numbered table with Name, Status, Slug, Page columns

**JSON (`--json`):**
```json
{
  "products": [{ "name": "...", "status": "LIVE DATA", "slug": "...", "url": "/apiProduct/...", "pageNumber": 1 }],
  "totalProducts": 31,
  "pagesScraped": 5,
  "emptyPages": 2,
  "scrapedAt": "2026-02-13T...",
  "sourceUrl": "https://developer.nbg.gr/apiProducts"
}
```

### Key Design Decisions

1. **`eval` over `snapshot+click` for pagination** - `click "NEXT"` failed in the live session; JS eval is proven reliable
2. **`eval` for data extraction** - Direct DOM querying returns structured JSON, more reliable than parsing accessibility tree
3. **Headed by default** - Matches the project's browser automation context
4. **Stop on empty pages** - Pages 6-7 were empty; default behavior stops early to save time
5. **Session-per-run** - Unique session name avoids stale state conflicts

## Verification

1. `cd tools/nbg-api-products && npm run dev -- --verbose` - Human-readable output, headed browser
2. `npm run dev -- --json --verbose` - JSON output
3. `npm run dev -- --json -o /tmp/nbg-apis.json` - File output
4. `npm run dev -- --headless --json` - Headless mode
5. Verify output matches the 31 APIs found in the live session
