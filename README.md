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
pnpm prisma db-push
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

### Running the Seeder

```bash
# Seed the database
NODE_ENV=development pnpm db-seed -t --count 1000
```

## Project Structure

- `prisma/`: Contains Prisma schema and migration files
- `app/api/`: Next.js pages and API routes
- `prisma/seeder/`: Custom seeding scripts and configurations
- `utils/`: Utility functions for logging and other tasks

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

### Supported Entities

- Users
- Products
- Orders
- Order Items

## Approach to Implementing JWT Authentication

[JWT Implementation Guide](./JWT%20Implementation%20Guide.md)

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
