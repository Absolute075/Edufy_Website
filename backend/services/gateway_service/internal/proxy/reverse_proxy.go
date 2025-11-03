package proxy

import (
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

func ReverseProxy(target string) gin.HandlerFunc {
	targetURL, _ := url.Parse(target)

	return func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		// добавляем оригинальный путь запроса
		c.Request.URL.Path = c.Param("path")

		// если был query ?x=1&y=2, сохраняем
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
