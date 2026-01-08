.PHONY: build run dev clean test install

# Build the Go application
build:
	@echo "Building server..."
	go build -o server main.go
	@echo "Build complete! Binary: ./server"

# Run the built server
run: build
	@echo "Starting server..."
	./server

# Run in development mode (requires air for live reload)
dev:
	@echo "Starting development server..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not installed. Install with: go install github.com/air-verse/air@latest"; \
		echo "Running without live reload..."; \
		go run main.go; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning..."
	rm -f server
	@echo "Clean complete!"

# Install dependencies
install:
	@echo "Installing dependencies..."
	go mod download
	@echo "Dependencies installed!"

# Run tests (if any)
test:
	@echo "Running tests..."
	go test -v ./...

# Help
help:
	@echo "Available targets:"
	@echo "  build   - Build the server binary"
	@echo "  run     - Build and run the server"
	@echo "  dev     - Run in development mode with live reload"
	@echo "  clean   - Remove build artifacts"
	@echo "  install - Install dependencies"
	@echo "  test    - Run tests"
	@echo "  help    - Show this help message"
