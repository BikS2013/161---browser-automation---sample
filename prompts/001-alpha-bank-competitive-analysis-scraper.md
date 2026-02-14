# Alpha Bank Product Competitive Analysis - Web Scraping Prompt

## Objective
Visit the Alpha Bank Greece website (https://www.alpha.gr/) using browser automation to systematically collect comprehensive product information for competitive analysis purposes.

## Instructions

Use the browser automation tool in **headed mode** (visible browser) to navigate through the Alpha Bank website and collect detailed information about all banking products and services offered.

### Target Website
- **URL:** https://www.alpha.gr/
- **Language:** Greek (primary) - paths start with `/el/`
- **Alternative:** English version available at `/en/` paths

---

## Product Categories to Explore

### 1. Banking Accounts (Λογαριασμοί)
**Main URL:** `/el/idiotes/logariasmoi`

For each account type, collect:
- Account name (Greek and English)
- Target customer segment (individuals, businesses, age groups)
- Minimum opening deposit
- Minimum balance requirements
- Interest rates (if applicable)
- Account maintenance fees
- Transaction fees
- Opening method (online vs. branch)
- Required documents
- Associated cards (debit/credit)
- Special features and benefits
- Eligibility criteria
- Overdraft options

### 2. Loans (Δάνεια)
**Main URL:** `/el/idiotes/daneia`

**Sub-categories to explore:**
- Consumer loans (Καταναλωτικά)
- Mortgage loans (Στεγαστικά)
- Renovation loans (Επισκευαστικά)
- Green loans (Πράσινα)

For each loan product, collect:
- Loan name and type
- Minimum and maximum loan amounts
- Interest rates (fixed/variable, APR)
- Loan term options (min/max duration)
- Repayment schedule options
- Collateral requirements
- Eligibility criteria (income, employment, age)
- Required documentation
- Processing fees
- Early repayment terms and penalties
- Insurance requirements
- Special promotions or discounts

### 3. Cards (Κάρτες)
**Main URL:** `/el/idiotes/kartes`

**Sub-categories to explore:**
- Debit cards (Χρεωστικές)
- Credit cards (Πιστωτικές)
- Prepaid cards (Προπληρωμένες)
- Government program cards
- Digital wallets

For each card product, collect:
- Card name and brand (Visa/Mastercard)
- Card tier (classic, gold, platinum, premium)
- Annual fee (first year and subsequent)
- Interest rate for credit cards
- Credit limit range (for credit cards)
- Rewards program details (cashback, points, miles)
- Partner benefits and discounts
- Contactless/NFC capability
- Mobile wallet compatibility (Apple Pay, Google Pay)
- Foreign transaction fees
- ATM withdrawal limits and fees
- Insurance coverage included
- Eligibility requirements

### 4. Insurance Products (Ασφάλειες)
**Main URL:** `/el/idiotes/asfaleies`

**Sub-categories to explore:**
- Health insurance (Υγεία)
- Home insurance (Σπίτι)
- Car insurance (Αυτοκίνητο)
- Card/loan protection
- Investment-linked insurance

For each insurance product, collect:
- Product name
- Coverage types and limits
- Premium pricing (monthly/annual)
- Deductibles
- Exclusions
- Claim process
- Partner insurance company
- Bundled discounts

### 5. Investment Products (Επενδύσεις)
**Main URL:** `/el/idiotes/ependuseis`

**Sub-categories to explore:**
- Mutual funds (Αμοιβαία κεφάλαια)
- Stocks and brokerage (Μετοχές)
- Bonds (Ομόλογα)
- Term deposits (Προθεσμιακές καταθέσεις)

For each investment product, collect:
- Product name and type
- Minimum investment amount
- Expected returns / historical performance
- Risk level classification
- Management fees
- Entry/exit fees
- Lock-up periods
- Liquidity terms
- Tax implications mentioned

### 6. Digital Banking Services
**Main URL:** `/el/idiotes/myalpha`

Collect information about:
- Mobile app features (myAlpha Mobile)
- Web banking features (myAlpha Web)
- Digital onboarding capabilities
- Bill payment services
- Money transfer options (domestic/international)
- Account aggregation features
- Security features (biometrics, 2FA)
- Customer support channels

### 7. Business Banking (if applicable)
**Main URL:** `/el/epixeiriseis`

Explore business products including:
- Business accounts
- Business loans
- Business cards
- POS terminals
- Trade finance
- Cash management

---

## Output Format

Generate a structured competitive analysis report with the following sections:

### Executive Summary
- Overview of Alpha Bank's product portfolio
- Key differentiators identified
- Market positioning observations

### Product Catalog
For each product category, create a table with:
| Product Name | Key Features | Pricing | Target Segment | Competitive Notes |

### Pricing Analysis
- Fee structure comparison tables
- Interest rate summaries
- Hidden costs identified

### Digital Capabilities Assessment
- Online account opening availability
- Mobile app features
- Digital-first products

### Strengths and Weaknesses
- Product gaps identified
- Unique offerings
- Areas of competitive advantage

### Raw Data Appendix
- Complete URLs visited
- Full product specifications
- Terms and conditions highlights

---

## Technical Requirements

1. **Browser Mode:** Use headed mode (visible browser) for navigation
2. **Navigation Strategy:**
   - Start from main category pages
   - Visit each product's individual page
   - Capture both overview and detailed specifications
3. **Data Capture:**
   - Extract text content from product pages
   - Note any PDF documents linked (price lists, terms)
   - Capture promotional offers with validity dates
4. **Language Handling:**
   - Primary collection in Greek
   - Note English translations where available

---

## Quality Checks

Before completing, verify:
- [ ] All main product categories have been visited
- [ ] Individual product pages have been accessed (not just category overviews)
- [ ] Pricing information has been captured where available
- [ ] Eligibility criteria documented for each product
- [ ] URLs are recorded for reference
- [ ] Any broken links or missing pages are noted

---

## Notes

- The website may have cookie consent popups - accept and continue
- Some detailed pricing may require PDF downloads or branch inquiry
- Business hours for customer service: typically 8:00-22:30
- Products may have seasonal promotions - note validity dates
- Consider both retail (ιδιώτες) and business (επιχειρήσεις) segments
