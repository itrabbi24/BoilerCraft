package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	r := gin.Default()
	r.StaticFile("/", "./public/index.html")
	r.Static("/assets", "./public")

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "app": {{APP_TITLE_JS}}})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "{{PORT}}"
	}
	log.Printf("{{PROJECT_NAME}} listening on http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
