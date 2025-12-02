package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"admin_service/internal/admin/handler"
	adminsvc "admin_service/internal/admin/service"
	"admin_service/internal/routes"
	appcfg "admin_service/pkg/config"
)

func main() {
	cfg := appcfg.Load()
	if cfg.AdminUsername == "" || cfg.AdminPassword == "" {
		log.Println("[WARN] ADMIN_USERNAME or ADMIN_PASSWORD is not set")
	}

	r := gin.Default()

	adminService := adminsvc.NewAdminService(cfg)
	adminHandler := handler.NewAdminHandler(cfg, adminService)

	routes.Register(r, cfg, adminHandler)

	addr := ":" + cfg.Port
	log.Println("admin_service listening on", addr)
	if err := r.Run(addr); err != nil {
		log.Fatal(err)
	}
}
