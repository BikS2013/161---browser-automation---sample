## Project Instructions

- Every time you want to create a test script, you must create it in the test_scripts folder. If the folder doesn't exist, you must make it.

- All the plans must be kept under the docs/design folder inside the project's folder in separate files: Each plan file must be named according to the following pattern: plan-xxx-<indicative description>.md

- The complete project design must be maintained inside a file named docs/design/project-design.md under the project's folder. The file must be updated with each new design or design change.

- All the reference material used for the project must be collected and kept under the docs/reference folder.
- All the functional requirements and all the feature descriptions must be registered in the /docs/design/project-functions.MD document under the project's folder.

- Every time you create a prompt working in a project, the prompt must be placed inside a dedicated folder named prompts. If the folder doesn't exists you must create it. The prompt file name must have an sequential number prefix and must be representative to the prompt use and purpose.

- You must maintain a document at the root level of the project, named "Issues - Pending Items.md," where you must register any issue, pending item, inconsistency, or discrepancy you detect. Every time you fix a defect or an issue, you must check this file to see if there is an item to remove.
- The "Issues - Pending Items.md" content must be organized with the pending items on top and the completed items after. From the pending items the most critical and important must be first followed by the rest.

- When I ask you to create tools in the context of a project everything must be in Typescript.
- Every tool you develop must be documented in the project's Claude.md file
- The documentation must be in the following format:
<toolName>
    <objective>
        what the tool does
    </objective>
    <command>
        the exact command to run
    </command>
    <info>
        detailed description of the tool
        command line parameters and their description
        examples of usage
    </info>
</toolName>

- Every time I ask you to do something that requires the creation of a code script, I want you to examine the tools already implemented in the scope of the project to detect if the code you plan to write, fits to the scope of the tool.
- If so, I want you to implement the code as an extension of the tool, otherwise I want you to build a generic and abstract version of the code as a tool, which will be part of the toolset of the project.
- Our goal is, while the project progressing, to develop the tools needed to test, evaluate, generate data, collect information, etc and reuse them in a consistent manner.
- All these tools must be documented inside the CLAUDE.md to allow their consistent reuse.

## Available Tools

<nbg-api-products>
    <objective>
        Scrape the API Products listing from the NBG Developer Portal (developer.nbg.gr) using browser automation, extracting product names, statuses, slugs, and URLs across all pagination pages.
    </objective>
    <command>cd tools/nbg-api-products && npm run dev -- [options]</command>
    <info>
        This TypeScript CLI tool uses agent-browser to automate navigation through the NBG Developer Portal and extract API product data from the paginated listing at https://developer.nbg.gr/apiProducts.

        **Workflow:**
        1. Opens the NBG Developer Portal
        2. Accepts cookie consent dialog (if present)
        3. Navigates to the API Products page
        4. Detects pagination (reads page numbers from DOM)
        5. Iterates through each page, extracting products via JS eval
        6. Clicks NEXT via JS eval for pagination
        7. Outputs results as table or JSON
        8. Closes the browser session

        **Options:**
        - `--headless` - Run browser in headless mode (default: headed/visible)
        - `--json` - Output results as JSON
        - `-o, --output <file>` - Write output to a file instead of stdout
        - `-v, --verbose` - Show detailed progress messages and agent-browser commands
        - `--max-pages <n>` - Maximum pages to iterate (default: 10)
        - `--no-stop-empty` - Don't stop when an empty page is encountered (default: stops on first empty page)
        - `-h, --help` - Show help message

        **Output Formats:**

        Human-readable (default): Bordered table with columns #, Name, Status, Slug, Page

        JSON (`--json`): Structured object with fields:
        - `products[]` - Array of {name, status, slug, url, pageNumber}
        - `totalProducts` - Count of APIs found
        - `pagesScraped` - Number of pages visited
        - `emptyPages` - Number of pages with no products
        - `scrapedAt` - ISO 8601 timestamp
        - `sourceUrl` - The portal URL scraped

        **Examples:**
        ```bash
        # Default: headed browser, human-readable table
        npm run dev

        # Verbose mode to see all commands executed
        npm run dev -- --verbose

        # JSON output to stdout
        npm run dev -- --json

        # JSON output saved to file
        npm run dev -- --json -o /tmp/nbg-apis.json

        # Headless mode with JSON
        npm run dev -- --headless --json

        # Limit to 3 pages, don't stop on empty
        npm run dev -- --max-pages 3 --no-stop-empty --verbose
        ```

        **Prerequisites:**
        - Node.js 18+
        - agent-browser CLI (`npm install -g agent-browser`)
        - Dependencies installed: `cd tools/nbg-api-products && npm install`

        **Key Design Notes:**
        - Uses JS eval for product extraction and pagination (more reliable than snapshot+click for this site)
        - Each run creates a unique browser session to avoid stale state conflicts
        - Stops on first empty page by default (the portal has trailing empty pages)
        - Deduplicates products by slug within each page
    </info>
</nbg-api-products>
