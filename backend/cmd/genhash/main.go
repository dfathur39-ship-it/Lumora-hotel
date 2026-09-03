package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Generate hash untuk password "admin123"
	password := "admin123"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	
	fmt.Println("Password:", password)
	fmt.Println("Hash:", string(hash))
	fmt.Println("\nSQL untuk update user:")
	fmt.Printf("UPDATE users SET password_hash = '%s' WHERE email = 'your@email.com';\n", string(hash))
}
