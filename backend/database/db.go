package database

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect opens a pooled connection to the Supabase PostgreSQL instance
// pointed to by databaseURL (found in the project's Supabase dashboard
// under Project Settings -> Database -> Connection string).
func Connect(databaseURL string) *pgxpool.Pool {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("invalid DATABASE_URL: %v", err)
	}

	// Required when DATABASE_URL points at Supabase's Transaction Pooler
	// (PgBouncer in transaction mode, typically port 6543) — the default
	// pgx protocol relies on server-side prepared statements, which
	// PgBouncer's transaction pooling does not support across pooled
	// connections. Simple protocol mode avoids that entirely. This is
	// also safe and has no downside when connecting directly (port 5432).
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		log.Fatalf("unable to create connection pool: %v", err)
	}

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("unable to reach database: %v", err)
	}

	log.Println("connected to Supabase PostgreSQL")
	return pool
}
