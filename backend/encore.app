{
	"id":   "cms-react-encore-i4h2",
	"lang": "typescript",
	"build": {
		"docker": {
			"bundle_source": true
		}
	},
	"global_cors": {
		"debug": true,
		"allow_origins_without_credentials": [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
			"http://localhost:4000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5175",
			"http://127.0.0.1:4000"
		],
		"allow_origins_with_credentials": [
			"http://localhost:5173",
			"http://localhost:5174",
			"http://localhost:5175",
			"http://localhost:4000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"http://127.0.0.1:5175",
			"http://127.0.0.1:4000"
		],
		"allow_headers": [
			"Content-Type",
			"Authorization",
			"Accept",
			"Origin",
			"User-Agent",
			"Cache-Control"
		],
		"expose_headers": [
			"Content-Type",
			"Authorization"
		]
	}
}
