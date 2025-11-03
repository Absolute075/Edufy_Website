package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"

	"github.com/gin-gonic/gin"
)

// ServiceProxy создаёт gin.HandlerFunc для любого сервиса по его URL и basePath
func ServiceProxy(target string, basePath string) gin.HandlerFunc {
	targetURL, err := url.Parse(target)
	if err != nil {
		panic("Invalid proxy target URL: " + target)
	}

	return func(c *gin.Context) {
		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		// корректный путь на целевой сервис
		c.Request.URL.Path = basePath + c.Param("path")

		// обработка ошибок
		proxy.ErrorHandler = func(rw http.ResponseWriter, req *http.Request, err error) {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte("Proxy error: " + err.Error()))
		}

		proxy.ServeHTTP(c.Writer, c.Request)
	}
}
