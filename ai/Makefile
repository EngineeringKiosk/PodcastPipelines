.DEFAULT_GOAL := help

.PHONY: help
help: ## Outputs the help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: run
run: ## Starts the development server
	set -a && source ./.env && set +a && npm run dev -- $(filter-out $@,$(MAKECMDGOALS))

.PHONY: build
build: ## Builds the project
	npm run build

.PHONY: init
init: ## Installs dependencies
	npm install
