# E-commerce Mock Data Generator for Frogstats

This script generates realistic mock analytics data for Frogstats, simulating user behavior on an e-commerce website called ShopEase.

## Features

- Generates approximately 5 million events per day over a specified number of days
- Creates realistic user shopping sessions with multiple pageviews and custom events
- Models realistic e-commerce user journeys (browsing, product views, add to cart, checkout, purchase)
- Sessions end after 30 minutes of inactivity
- Distributes traffic realistically throughout the day (with peak hours)
- Uses Faker.js to generate realistic product data, location information, and more
- Uses weighted distributions for pages, browsers, operating systems, screen sizes, and more
- Varies the number of events per day to be more realistic

## Requirements

- Node.js 14+
- ClickHouse database set up (configuration in .env file)

## Installation

1. Make sure all dependencies are installed:

```bash
npm install
```

## Usage

Run the script with optional parameters:

```bash
# Default: 30 days with ~5 million events per day
npm run generate

# Custom parameters (days, events per day)
node index.js 15 2000000  # 15 days with ~2 million events per day
```

### Parameters

1. `daysInPast`: Number of days in the past to generate data for (default: 30)
2. `eventsPerDay`: Approximate number of events per day (default: 5,000,000)

## Data Distribution

The script creates realistic distributions of:

- Page views with appropriate e-commerce user flows
- Shopping behavior patterns (browsing, cart additions, checkouts, purchases)
- Geographic distribution (countries and regions using Faker.js)
- Browser types and versions
- Operating systems
- Screen resolutions
- Referrers (including social media and other e-commerce sites)
- Custom events specific to e-commerce (product views, add to cart, checkout steps, etc.)
- Time of day (peak hours vs. off hours)

## E-commerce Event Types

The generator includes these e-commerce-specific events:

- page-view - Basic page view tracking
- product-view - When a user views a product detail page
- add-to-cart - When a user adds an item to their cart
- remove-from-cart - When a user removes an item from their cart
- begin-checkout - When a user starts the checkout process
- checkout-step - Tracking each step of the checkout funnel
- purchase - When a user completes a purchase
- search - When a user searches for products
- filter-products - When a user applies filters to product listings
- add-to-wishlist - When a user adds items to their wishlist
- And more...

## Data Schema

Events are inserted into the ClickHouse `pageviews` table with the following schema:

- site_id
- timestamp
- session_id
- user_id
- hostname
- pathname
- querystring
- page_title
- referrer
- browser
- browser_version
- operating_system
- operating_system_version
- language
- country
- iso_3166_2
- screen_width
- screen_height
- device_type
- type (pageview or custom_event)
- event_name (for custom events)
- properties (JSON string for custom events)
