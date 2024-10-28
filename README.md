# Project Setup

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker](https://www.docker.com/) (for running PostgreSQL)
- [pnpm](https://pnpm.io/) (used as the package manager)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/emranffl/gain-solutions.git
cd gain-solutions
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

1. Copy .env.example to .env.local

```bash
cp .env.example .env.local
```

2. Update the `.env.local` file with your configuration.

### 4. Run the PostgreSQL database with Docker

```bash
docker-compose up -d
```

### 5. Set up the database

```bash
# Generate Prisma client
pnpm db-generate

# Run migrations
NODE_ENV=development pnpm db-push
```

### 6. Start the development server

```bash
pnpm dev
```

The app should now be running on [http://localhost:3000](http://localhost:3000).

## Database Seeding

### Running the Benchmark Seeder

```bash
# Seed the database
NODE_ENV=development pnpm db-benchmark
```

After running the benchmark seeder, you can run the seeder with the best configuration suggested by the benchmark.

### Running the Seeder

```bash
# Seed the database
NODE_ENV=development pnpm db-seed -t --count 100000
```

## Database Indexing

```sql
-- Index on deletedAt to optimize filtering out soft-deleted products
CREATE INDEX idx_product_deletedat ON "Product" ("deletedAt");

-- Full-text search index for combined name and description
CREATE INDEX idx_product_fulltext ON "Product" USING GIN (
  to_tsvector('english', name || ' ' || description)
);

-- Index on category to optimize filtering by category
CREATE INDEX idx_product_category ON "Product" ("category");

-- Index on price to optimize range and equality searches
CREATE INDEX idx_product_price ON "Product" ("price");

-- Index on createdAt to optimize sorting by creation date
CREATE INDEX idx_product_createdat ON "Product" ("createdAt");

-- Index on Order status for SHIPPED and DELIVERED only
CREATE INDEX idx_order_status_shipped_delivered ON "Order" (STATUS)
WHERE
  STATUS IN ('SHIPPED', 'DELIVERED');

-- Index on OrderItem for orderId to optimize joins with the Order table
CREATE INDEX idx_orderitem_orderid ON "OrderItem" ("orderId");

-- Index on OrderItem for productId to optimize joins with the Product table
CREATE INDEX idx_orderitem_productid ON "OrderItem" ("productId");

-- Index on canceledAt in the Order table to optimize filtering out canceled orders
CREATE INDEX idx_order_canceledat ON "Order" ("canceledAt");

-- Index on userId in the Order table to optimize filtering and relations with the User table
CREATE INDEX idx_order_userid ON "Order" ("userId");

-- Index on name in the User table to optimize sorting and filtering by name
CREATE INDEX idx_user_name ON "User" ("name");

-- Index on email in the User table to optimize sorting and filtering by email
CREATE INDEX idx_user_email ON "User" ("email");
```

## Batch Seeder Documentation

### Configuration

The BatchSeeder supports configuration through the constructor:

```typescript
const seeder = new BatchSeeder({
  batchSize: 100, // Number of records per batch
  parallelBatches: 7, // Number of parallel batches
})
```

### Usage

```typescript
const main = async (count: number) => {
  const seeder = new BatchSeeder({
    batchSize: 100,
    parallelBatches: 7,
  })
  await seeder.seed(count)
}
```

## Project Structure

- `prisma/`: Contains Prisma schema and migration files
- `app/api/`: Next.js pages and API routes
- `prisma/seeder/`: Custom seeding scripts and configurations
- `utils/`: Utility functions for logging and other tasks

### Supported Entities

- Users
- Products
- Orders
- Order Items

## Approach to Implementing JWT Authentication

Head over to the
[JWT Implementation Guide](./JWT%20Implementation%20Guide.md) for a detailed explanation of the approach taken to implement JWT authentication.

## Troubleshooting

### Common Issues

1. **Docker Issues**

   - Ensure Docker is running
   - Check if required ports are not in use

2. **Environment Variables**
   - Verify your `.env.local` file configuration
   - Ensure all required variables are set

## Contact

For questions, please contact:  
**[Emran Hossain](mailto:emranffl.biz@gmail.com)**
