SHELL := /bin/bash

default: lint test

lint:
	@node_modules/.bin/autolint --once

.PHONY: test
test:
	@node -e "require('urun')('test');"

compile: lint test
	@nomo
	@node_modules/.bin/uglifyjs hub.js > hub.min.js
