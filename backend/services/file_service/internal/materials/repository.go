package materials

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type Repository interface {
	LoadManifest() (*Manifest, error)
}

type fileRepository struct {
	publicDir   string
	manifestRel string
	mu          sync.RWMutex
	cache       *Manifest
	cacheAt     time.Time
	ttl         time.Duration
}

func NewFileRepository(publicDir, manifestRel string) Repository {
	return &fileRepository{publicDir: publicDir, manifestRel: manifestRel, ttl: 5 * time.Minute}
}

func (r *fileRepository) LoadManifest() (*Manifest, error) {
	r.mu.RLock()
	if r.cache != nil && time.Since(r.cacheAt) < r.ttl {
		defer r.mu.RUnlock()
		copy := *r.cache
		return &copy, nil
	}
	r.mu.RUnlock()

	r.mu.Lock()
	defer r.mu.Unlock()
	// double check after acquiring write lock
	if r.cache != nil && time.Since(r.cacheAt) < r.ttl {
		copy := *r.cache
		return &copy, nil
	}
	p := filepath.Join(r.publicDir, r.manifestRel)
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, fmt.Errorf("read manifest: %w", err)
	}
	var m Manifest
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, fmt.Errorf("parse manifest: %w", err)
	}
	r.cache = &m
	r.cacheAt = time.Now()
	copy := *r.cache
	return &copy, nil
}
