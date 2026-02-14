import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Configuration
const CONFIG = {
  portalUrl: "https://developer.nbg.gr",
  apiProductsPath: "/apiProducts",
  commandTimeout: 30000,
  pageLoadDelay: 3000,
  navigationDelay: 2000,
};

// --- Interfaces ---

interface SnapshotElement {
  ref: string;
  type: string;
  text: string;
  raw: string;
}

interface ApiProduct {
  name: string;
  status: string;
  slug: string;
  url: string;
  pageNumber: number;
}

interface ScrapeResult {
  products: ApiProduct[];
  totalProducts: number;
  pagesScraped: number;
  emptyPages: number;
  scrapedAt: string;
  sourceUrl: string;
}

interface ToolOptions {
  headed: boolean;
  json: boolean;
  output?: string;
  verbose: boolean;
  maxPages: number;
  stopOnEmpty: boolean;
}

// --- Scraper Class ---

class NbgApiProductsScraper {
  private headed: boolean;
  private json: boolean;
  private outputPath?: string;
  private verbose: boolean;
  private maxPages: number;
  private stopOnEmpty: boolean;
  private sessionName: string;

  constructor(options: ToolOptions) {
    this.headed = options.headed;
    this.json = options.json;
    this.outputPath = options.output;
    this.verbose = options.verbose;
    this.maxPages = options.maxPages;
    this.stopOnEmpty = options.stopOnEmpty;
    this.sessionName = `nbg-scraper-${Date.now()}`;
  }

  /**
   * Execute an agent-browser command and return the output
   */
  private executeCommand(command: string): string {
    const headedFlag = this.headed ? "--headed" : "";
    const sessionFlag = `--session ${this.sessionName}`;
    const fullCommand = `agent-browser ${sessionFlag} ${headedFlag} ${command}`.trim();

    if (this.verbose) {
      console.log(`  [cmd] ${fullCommand}`);
    }

    try {
      const output = execSync(fullCommand, {
        encoding: "utf-8",
        timeout: CONFIG.commandTimeout,
      });
      return output;
    } catch (error) {
      throw new Error(`Command failed: ${fullCommand}\n${error}`);
    }
  }

  /**
   * Execute JavaScript code via agent-browser eval using a temp file to avoid shell escaping issues
   */
  private evalJavaScript(jsCode: string): string {
    const tmpFile = path.join(os.tmpdir(), `nbg-eval-${Date.now()}.js`);
    const headedFlag = this.headed ? "--headed" : "";
    const sessionFlag = `--session ${this.sessionName}`;

    fs.writeFileSync(tmpFile, jsCode, "utf-8");

    try {
      // Use env variable to pass JS code safely, avoiding shell escaping
      const shellCmd = `agent-browser ${sessionFlag} ${headedFlag} eval "$NBG_EVAL_JS"`.trim();

      if (this.verbose) {
        console.log(`  [eval] executing JS (${jsCode.length} chars) via env var`);
      }

      const output = execSync(shellCmd, {
        encoding: "utf-8",
        timeout: CONFIG.commandTimeout,
        env: { ...process.env, NBG_EVAL_JS: jsCode },
      });
      return output;
    } catch (error) {
      throw new Error(`Eval failed: ${error}`);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }

  /**
   * Parse snapshot output into structured elements
   */
  private parseSnapshot(output: string): SnapshotElement[] {
    const elements: SnapshotElement[] = [];
    const lines = output.split("\n").filter((line) => line.trim().startsWith("-"));

    for (const line of lines) {
      const refMatch = line.match(/\[ref=(\w+)\]/);
      const typeMatch = line.match(/^-\s*(\w+)/);
      const textMatch = line.match(/"([^"]+)"/);

      if (refMatch) {
        elements.push({
          ref: refMatch[1],
          type: typeMatch ? typeMatch[1] : "unknown",
          text: textMatch ? textMatch[1] : "",
          raw: line,
        });
      }
    }

    return elements;
  }

  /**
   * Find element by partial text match
   */
  private findElementByText(
    elements: SnapshotElement[],
    searchText: string,
    elementType?: string
  ): SnapshotElement | undefined {
    return elements.find((el) => {
      const textMatch = el.text.toLowerCase().includes(searchText.toLowerCase());
      const typeMatch = elementType ? el.type === elementType : true;
      return textMatch && typeMatch;
    });
  }

  /**
   * Helper: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log a message only in verbose mode
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(message);
    }
  }

  // --- Workflow Steps ---

  /**
   * Step 1: Open the NBG Developer Portal
   */
  async openSite(): Promise<void> {
    this.log("\n[Step 1] Opening NBG Developer Portal...");
    this.executeCommand(`open ${CONFIG.portalUrl}`);
    this.log("  Site opened successfully");
    await this.delay(CONFIG.pageLoadDelay);
  }

  /**
   * Step 2: Accept cookies if the consent dialog appears
   */
  async acceptCookies(): Promise<void> {
    this.log("\n[Step 2] Checking for cookie consent dialog...");

    const snapshot = this.executeCommand("snapshot -i");
    const elements = this.parseSnapshot(snapshot);

    // Look for an Accept button (cookie consent)
    const acceptButton =
      this.findElementByText(elements, "accept", "button") ||
      this.findElementByText(elements, "accept all", "button") ||
      this.findElementByText(elements, "agree", "button");

    if (acceptButton) {
      this.executeCommand(`click @${acceptButton.ref}`);
      this.log("  Accepted cookies");
      await this.delay(1000);
    } else {
      this.log("  No cookie dialog found, continuing...");
    }
  }

  /**
   * Step 3: Navigate to the API Products page
   */
  async navigateToApiProducts(): Promise<void> {
    this.log("\n[Step 3] Navigating to API Products...");

    const snapshot = this.executeCommand("snapshot -i");
    const elements = this.parseSnapshot(snapshot);

    // Find the "API PRODUCTS" link
    const apiProductsLink =
      this.findElementByText(elements, "API PRODUCTS", "link") ||
      this.findElementByText(elements, "api products", "link");

    if (apiProductsLink) {
      this.executeCommand(`click @${apiProductsLink.ref}`);
      this.log("  Clicked API PRODUCTS link");
    } else {
      // Fallback: navigate directly to the API Products URL
      this.log("  API PRODUCTS link not found, navigating directly...");
      this.executeCommand(`open ${CONFIG.portalUrl}${CONFIG.apiProductsPath}`);
    }

    await this.delay(CONFIG.pageLoadDelay);
  }

  /**
   * Extract API products from the current page using JS eval
   * Queries the DOM for anchor elements linking to /apiProduct/
   */
  extractProductsFromPage(pageNum: number): ApiProduct[] {
    this.log(`\n[Extract] Scraping products from page ${pageNum}...`);

    const jsCode = `JSON.stringify(
      Array.from(document.querySelectorAll('a[href*="/apiProduct/"]'))
        .map(function(a) {
          var href = a.getAttribute('href') || '';
          var slug = href.replace(/.*\\/apiProduct\\//, '');
          var card = a.closest('[class*="card"]') || a.parentElement;
          var name = '';
          var status = '';
          var h3 = card ? card.querySelector('h3') : null;
          if (h3) {
            name = h3.textContent.trim();
          } else {
            name = a.textContent.trim().split('\\n')[0].trim();
          }
          var badges = card ? card.querySelectorAll('span') : [];
          for (var i = 0; i < badges.length; i++) {
            var t = badges[i].textContent.trim();
            if (t === 'LIVE DATA' || t === 'SANDBOX' || t === 'BETA' || t === 'DEPRECATED') {
              status = t;
              break;
            }
          }
          if (!status && card) {
            var allText = card.textContent || '';
            if (allText.indexOf('LIVE DATA') !== -1) status = 'LIVE DATA';
            else if (allText.indexOf('SANDBOX') !== -1) status = 'SANDBOX';
            else if (allText.indexOf('BETA') !== -1) status = 'BETA';
            else if (allText.indexOf('DEPRECATED') !== -1) status = 'DEPRECATED';
          }
          return { name: name, status: status, slug: slug, url: '/apiProduct/' + slug };
        })
        .filter(function(p) { return p.name.length > 0; })
    )`;

    try {
      const result = this.evalJavaScript(jsCode);

      // agent-browser eval wraps the result in a JSON string layer,
      // so the output is e.g. "[{\"name\":...}]" — we need to unwrap it
      let parsed = result.trim();

      // Unwrap outer JSON string if present (agent-browser wraps eval results)
      if (parsed.startsWith('"')) {
        parsed = JSON.parse(parsed);
      }

      // Now parsed should be the raw JSON array string from JSON.stringify
      const jsonStart = parsed.indexOf("[");
      const jsonEnd = parsed.lastIndexOf("]");

      if (jsonStart === -1 || jsonEnd === -1) {
        this.log(`  No products found on page ${pageNum}`);
        return [];
      }

      const jsonStr = parsed.substring(jsonStart, jsonEnd + 1);
      const products: ApiProduct[] = JSON.parse(jsonStr).map(
        (p: Omit<ApiProduct, "pageNumber">) => ({
          ...p,
          pageNumber: pageNum,
        })
      );

      // Deduplicate by slug (some cards may have multiple <a> tags)
      const seen = new Set<string>();
      const unique = products.filter((p) => {
        if (seen.has(p.slug)) return false;
        seen.add(p.slug);
        return true;
      });

      this.log(`  Found ${unique.length} products on page ${pageNum}`);
      return unique;
    } catch (error) {
      console.error(`  Error extracting products from page ${pageNum}: ${error}`);
      return [];
    }
  }

  /**
   * Detect total number of pagination pages via JS eval
   */
  detectTotalPages(): number {
    this.log("\n[Detect] Reading pagination...");

    const jsCode = `JSON.stringify(
      Array.from(document.querySelectorAll('li a'))
        .map(function(a) { return a.textContent.trim(); })
        .filter(function(t) { return /^[0-9]+$/.test(t); })
        .map(function(t) { return parseInt(t, 10); })
    )`;

    try {
      const result = this.evalJavaScript(jsCode);
      let parsed = result.trim();

      // Unwrap outer JSON string if present
      if (parsed.startsWith('"')) {
        parsed = JSON.parse(parsed);
      }

      const jsonStart = parsed.indexOf("[");
      const jsonEnd = parsed.lastIndexOf("]");

      if (jsonStart === -1 || jsonEnd === -1) {
        this.log("  Could not detect pagination, assuming 1 page");
        return 1;
      }

      const jsonStr = parsed.substring(jsonStart, jsonEnd + 1);
      const pageNumbers: number[] = JSON.parse(jsonStr);

      if (pageNumbers.length === 0) {
        this.log("  No pagination found, assuming 1 page");
        return 1;
      }

      const maxPage = Math.max(...pageNumbers);
      this.log(`  Detected ${maxPage} pages`);
      return maxPage;
    } catch (error) {
      this.log(`  Error detecting pages: ${error}`);
      return 1;
    }
  }

  /**
   * Navigate to the next page by clicking the NEXT pagination link via JS eval
   * Returns true if navigation succeeded, false if NEXT was not found
   */
  navigateToNextPage(): boolean {
    this.log("  Clicking NEXT...");

    const jsCode = `var links = document.querySelectorAll('li a'); var found = false; for(var i=0; i<links.length; i++) { if(links[i].textContent.trim() === 'NEXT') { links[i].click(); found = true; break; }} found ? 'clicked NEXT' : 'NEXT not found'`;

    try {
      const result = this.evalJavaScript(jsCode);
      const success = result.includes("clicked NEXT");

      if (success) {
        this.log("  Navigated to next page");
      } else {
        this.log("  NEXT link not found (last page reached)");
      }

      return success;
    } catch (error) {
      this.log(`  Error navigating to next page: ${error}`);
      return false;
    }
  }

  /**
   * Scrape all pages of API Products
   */
  async scrapeAllPages(): Promise<ScrapeResult> {
    const allProducts: ApiProduct[] = [];
    let pagesScraped = 0;
    let emptyPages = 0;
    let consecutiveEmpty = 0;

    // Detect total pages from the first page
    const totalPages = Math.min(this.detectTotalPages(), this.maxPages);

    console.log(`\nScraping up to ${totalPages} pages...\n`);

    for (let page = 1; page <= totalPages; page++) {
      const products = this.extractProductsFromPage(page);
      pagesScraped++;

      if (products.length === 0) {
        emptyPages++;
        consecutiveEmpty++;

        if (this.stopOnEmpty && consecutiveEmpty >= 1) {
          this.log(`  Empty page detected (page ${page}), stopping early`);
          break;
        }
      } else {
        consecutiveEmpty = 0;
        allProducts.push(...products);
        if (!this.verbose) {
          console.log(`  Page ${page}: ${products.length} APIs found`);
        }
      }

      // Navigate to next page (unless this is the last page)
      if (page < totalPages) {
        const navigated = this.navigateToNextPage();
        if (!navigated) {
          this.log("  No more pages available");
          break;
        }
        await this.delay(CONFIG.navigationDelay);
      }
    }

    return {
      products: allProducts,
      totalProducts: allProducts.length,
      pagesScraped,
      emptyPages,
      scrapedAt: new Date().toISOString(),
      sourceUrl: `${CONFIG.portalUrl}${CONFIG.apiProductsPath}`,
    };
  }

  /**
   * Close the browser session
   */
  closeBrowser(): void {
    this.log("\nClosing browser...");
    try {
      this.executeCommand("close");
      this.log("  Browser closed");
    } catch {
      this.log("  Browser may already be closed");
    }
  }

  /**
   * Format results as a human-readable table
   */
  private formatTable(result: ScrapeResult): string {
    const lines: string[] = [];

    lines.push("╔════════════════════════════════════════════════════════════════════════════════╗");
    lines.push("║     NBG Developer Portal - API Products                                       ║");
    lines.push("╠════════════════════════════════════════════════════════════════════════════════╣");
    lines.push(`║  Total APIs: ${String(result.totalProducts).padEnd(62)}║`);
    lines.push(`║  Pages Scraped: ${String(result.pagesScraped).padEnd(59)}║`);
    lines.push(`║  Empty Pages: ${String(result.emptyPages).padEnd(61)}║`);
    lines.push(`║  Scraped At: ${result.scrapedAt.padEnd(62)}║`);
    lines.push("╚════════════════════════════════════════════════════════════════════════════════╝");
    lines.push("");

    // Table header
    const nameWidth = 45;
    const statusWidth = 12;
    const slugWidth = 30;
    const pageWidth = 4;

    lines.push(
      `${"#".padEnd(4)} ${"Name".padEnd(nameWidth)} ${"Status".padEnd(statusWidth)} ${"Slug".padEnd(slugWidth)} ${"Pg".padEnd(pageWidth)}`
    );
    lines.push("-".repeat(4 + 1 + nameWidth + 1 + statusWidth + 1 + slugWidth + 1 + pageWidth));

    result.products.forEach((p, i) => {
      const num = String(i + 1).padEnd(4);
      const name = p.name.length > nameWidth ? p.name.substring(0, nameWidth - 3) + "..." : p.name.padEnd(nameWidth);
      const status = p.status.padEnd(statusWidth);
      const slug = p.slug.length > slugWidth ? p.slug.substring(0, slugWidth - 3) + "..." : p.slug.padEnd(slugWidth);
      const page = String(p.pageNumber).padEnd(pageWidth);

      lines.push(`${num} ${name} ${status} ${slug} ${page}`);
    });

    return lines.join("\n");
  }

  /**
   * Run the complete scraping workflow
   */
  async run(): Promise<void> {
    console.log("NBG Developer Portal - API Products Scraper");
    console.log("============================================\n");

    if (this.verbose) {
      console.log(`Session: ${this.sessionName}`);
      console.log(`Mode: ${this.headed ? "headed" : "headless"}`);
      console.log(`Max pages: ${this.maxPages}`);
      console.log(`Stop on empty: ${this.stopOnEmpty}`);
    }

    try {
      await this.openSite();
      await this.acceptCookies();
      await this.navigateToApiProducts();

      const result = await this.scrapeAllPages();

      // Output results
      if (this.json) {
        const jsonOutput = JSON.stringify(result, null, 2);

        if (this.outputPath) {
          const resolvedPath = path.resolve(this.outputPath);
          fs.writeFileSync(resolvedPath, jsonOutput, "utf-8");
          console.log(`\nResults written to: ${resolvedPath}`);
        } else {
          console.log(jsonOutput);
        }
      } else {
        const table = this.formatTable(result);

        if (this.outputPath) {
          const resolvedPath = path.resolve(this.outputPath);
          fs.writeFileSync(resolvedPath, table, "utf-8");
          console.log(`\nResults written to: ${resolvedPath}`);
        } else {
          console.log(table);
        }
      }

      console.log(`\nDone. ${result.totalProducts} API products found across ${result.pagesScraped} pages.`);
    } catch (error) {
      console.error("\nError:", error);
      throw error;
    } finally {
      this.closeBrowser();
    }
  }
}

// --- CLI ---

function parseArgs(args: string[]): ToolOptions {
  const options: ToolOptions = {
    headed: true,
    json: false,
    output: undefined,
    verbose: false,
    maxPages: 10,
    stopOnEmpty: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--headless") {
      options.headed = false;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "-o" || arg === "--output") {
      options.output = args[++i];
    } else if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--max-pages") {
      const val = parseInt(args[++i], 10);
      if (isNaN(val) || val < 1) {
        console.error("Error: --max-pages must be a positive integer");
        process.exit(1);
      }
      options.maxPages = val;
    } else if (arg === "--no-stop-empty") {
      options.stopOnEmpty = false;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
NBG Developer Portal - API Products Scraper

Scrapes the API Products listing from developer.nbg.gr using browser automation.

Usage: npm run dev -- [options]

Options:
  --headless            Run browser in headless mode (default: headed)
  --json                Output results as JSON
  -o, --output <file>   Write output to a file
  -v, --verbose         Show detailed progress messages
  --max-pages <n>       Maximum pages to iterate (default: 10)
  --no-stop-empty       Don't stop when an empty page is encountered
  -h, --help            Show this help message

Examples:
  # Scrape with visible browser (default), human-readable output
  npm run dev

  # Verbose mode
  npm run dev -- --verbose

  # JSON output
  npm run dev -- --json

  # JSON output to file
  npm run dev -- --json -o /tmp/nbg-apis.json

  # Headless mode with JSON
  npm run dev -- --headless --json

  # Limit to 3 pages, don't stop on empty pages
  npm run dev -- --max-pages 3 --no-stop-empty --verbose

Notes:
  - Requires agent-browser CLI: npm install -g agent-browser
  - Browser runs in headed mode by default (visible window)
  - By default, scraping stops when an empty page is encountered
  - Each run creates a unique browser session to avoid conflicts
  - The portal is at https://developer.nbg.gr/apiProducts
`);
}

// --- Main ---

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  const scraper = new NbgApiProductsScraper(options);

  // Handle cleanup on exit
  process.on("SIGINT", () => {
    console.log("\n\nInterrupted. Closing browser...");
    scraper.closeBrowser();
    process.exit(0);
  });

  await scraper.run();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
