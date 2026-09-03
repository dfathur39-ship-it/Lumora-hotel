package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	fmt.Println("DATABASE_URL:", dbURL)
	fmt.Println("Attempting to connect to database...")

	// Try to connect
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}
	defer pool.Close()

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}

	fmt.Println("✅ Database connection successful!")

	// Test query
	var count int
	err = pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Fatalf("Query failed: %v\n", err)
	}

	fmt.Printf("✅ Query successful! Total users: %d\n", count)

	// List users
	rows, err := pool.Query(ctx, "SELECT id, name, email, role FROM users ORDER BY created_at DESC LIMIT 5")
	if err != nil {
		log.Fatalf("Failed to query users: %v\n", err)
	}
	defer rows.Close()

	fmt.Println("\n📋 Recent users:")
	for rows.Next() {
		var id, name, email, role string
		if err := rows.Scan(&id, &name, &email, &role); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("  - %s <%s> (role: %s)\n", name, email, role)
	}

	fmt.Println("\n✅ Everything looks good! Backend should work.")
}
