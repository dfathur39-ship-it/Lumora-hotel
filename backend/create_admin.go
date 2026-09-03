package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Password yang akan digunakan: admin123
	password := "admin123"
	
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}
	
	fmt.Println("Password:", password)
	fmt.Println("Hash:", string(hash))
	fmt.Println("\nSQL Query:")
	fmt.Printf(`
-- Update existing user to admin or create new admin
-- Option 1: Update existing user (replace with your email)
UPDATE users 
SET password_hash = '%s',
    role = 'admin'
WHERE email = 'your@email.com';

-- Option 2: Create new admin user
INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES (
  gen_random_uuid()::text,
  'Admin',
  'admin@lumora.com',
  '%s',
  'admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    role = 'admin';

-- Verify
SELECT id, name, email, role FROM users WHERE email IN ('admin@lumora.com', 'your@email.com');
`, string(hash), string(hash))
}
