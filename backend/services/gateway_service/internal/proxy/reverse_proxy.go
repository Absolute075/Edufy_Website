package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"github.com/gin-gonic/gin"
)

// универсальный прокси
func ReverseProxy(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		url, _ := url.Parse(target)
		proxy := httputil.NewSingleHostReverseProxy(url)
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
