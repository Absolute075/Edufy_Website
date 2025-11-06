package main

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.Default()

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Manifest endpoint
	r.GET("/materials/manifest", func(c *gin.Context) {
		p := filepath.Join("public", "materials", "manifest.json")
		b, err := ioutil.ReadFile(p)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Manifest not found"})
			return
		}
		c.Header("Cache-Control", "public, max-age=300")
		c.Data(http.StatusOK, "application/json; charset=utf-8", b)
	})

	// Static serving for materials and other assets under /
	r.Static("/", "public")

	log.Printf("file_service listening on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
