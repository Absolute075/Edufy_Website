package main

import (
	"log"

	"edufy/file_service/internal/config"
	"edufy/file_service/internal/httpserver"
)

func main() {
	cfg := config.Load()
	r := httpserver.NewRouter(cfg)
	log.Printf("file_service listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
