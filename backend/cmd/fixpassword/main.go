package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
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

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v\n", err)
	}
	defer pool.Close()

	fmt.Println("=== PASSWORD HASH DEBUG ===")
	fmt.Println()

	// Test password
	testPassword := "admin123"
	fmt.Printf("Test Password: %s\n\n", testPassword)

	// Generate fresh hash
	hash, err := bcrypt.GenerateFromPassword([]byte(testPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	freshHash := string(hash)
	fmt.Printf("Fresh Generated Hash:\n%s\n\n", freshHash)

	// Test if hash works
	err = bcrypt.CompareHashAndPassword([]byte(freshHash), []byte(testPassword))
	if err != nil {
		fmt.Println("❌ Fresh hash TIDAK COCOK dengan password!")
		log.Fatal(err)
	}
	fmt.Println("✅ Fresh hash COCOK dengan password\n")

	// Get users from database
	rows, err := pool.Query(ctx, "SELECT id, email, password_hash FROM users ORDER BY created_at DESC")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("=== TESTING DATABASE HASHES ===\n")

	for rows.Next() {
		var id, email, dbHash string
		if err := rows.Scan(&id, &email, &dbHash); err != nil {
			log.Fatal(err)
		}

		fmt.Printf("User: %s\n", email)
		fmt.Printf("Hash length: %d\n", len(dbHash))
		fmt.Printf("Hash preview: %s...\n", dbHash[:20])

		// Test if database hash works with test password
		err = bcrypt.CompareHashAndPassword([]byte(dbHash), []byte(testPassword))
		if err != nil {
			fmt.Printf("❌ Database hash TIDAK COCOK dengan '%s'\n", testPassword)
		} else {
			fmt.Printf("✅ Database hash COCOK dengan '%s'\n", testPassword)
		}
		fmt.Println()
	}

	// Update all users with fresh hash
	fmt.Println("=== UPDATING ALL USERS ===")
	fmt.Printf("New hash: %s\n\n", freshHash)

	result, err := pool.Exec(ctx, "UPDATE users SET password_hash = $1", freshHash)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("✅ Updated %d users\n\n", result.RowsAffected())

	// Verify update
	fmt.Println("=== VERIFYING UPDATE ===\n")
	rows2, err := pool.Query(ctx, "SELECT email, password_hash FROM users")
	if err != nil {
		log.Fatal(err)
	}
	defer rows2.Close()

	allMatch := true
	for rows2.Next() {
		var email, dbHash string
		if err := rows2.Scan(&email, &dbHash); err != nil {
			log.Fatal(err)
		}

		err = bcrypt.CompareHashAndPassword([]byte(dbHash), []byte(testPassword))
		if err != nil {
			fmt.Printf("❌ %s - MASIH TIDAK COCOK\n", email)
			allMatch = false
		} else {
			fmt.Printf("✅ %s - COCOK\n", email)
		}
	}

	fmt.Println()
	if allMatch {
		fmt.Println("🎉 SUCCESS! Semua user sekarang bisa login dengan password: admin123")
	} else {
		fmt.Println("⚠️  Ada user yang masih bermasalah")
	}
}
