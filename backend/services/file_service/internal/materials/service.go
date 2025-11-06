package materials

import "fmt"

type Service interface {
	GetManifest() (*Manifest, error)
}

type service struct {
	repo Repository
}

func NewService(r Repository) Service { return &service{repo: r} }

func (s *service) GetManifest() (*Manifest, error) {
	m, err := s.repo.LoadManifest()
	if err != nil {
		return nil, fmt.Errorf("load manifest: %w", err)
	}
	return m, nil
}
