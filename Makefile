SHELL := /bin/bash

test:
	@node -e "require('urun')('test');"

compile: test
	@nomo
	@node_modules/.bin/uglifyjs hub.js > hub.min.js

.PHONY: test
