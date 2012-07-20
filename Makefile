SHELL := /bin/bash

test:
	@node_modules/.bin/autolint --once
	@node -e "require('urun')('test');"

compile: test
	@nomo
	@node_modules/.bin/uglifyjs hub.js > hub.min.js

.PHONY: test
