package materials

type Manifest struct {
	Version string         `json:"version"`
	Items   []ManifestItem `json:"items"`
}

type ManifestItem struct {
	ID           string `json:"id"`
	Title        string `json:"title"`
	Category     string `json:"category"`
	RequiredPlan string `json:"requiredPlan"`
	Active       bool   `json:"active"`
	URL          string `json:"url"`
}
