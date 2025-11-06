package main

import (
	"log"
	"os"

	"edufy/file_service/internal/config"
	"edufy/file_service/internal/httpserver"
)

func main() {
	// Load config and start centralized router
	_ = os.Setenv("GIN_MODE", "release")
	cfg := config.Load()
	r := httpserver.NewRouter(cfg)
	log.Printf("file_service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
