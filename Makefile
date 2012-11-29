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

version := $(shell node -e "console.log(require('./package.json').version)")
folder := hubjs-${version}

package: compile
	@echo "Creating package ${folder}.tgz"
	@mkdir ${folder}
	@mv hub.js hub.min.js ${folder}
	@cp LICENSE README.md ${folder}
	@tar -czf ${folder}.tgz ${folder}
	@rm -r ${folder}

release:
ifeq (v${version},$(shell git tag -l v${version}))
	@echo "Version ${version} already released!"
	@exit 1
endif
	@make package
	@echo "Creating tag v${version}"
	@git tag -a -m "Release ${version}" v${version}
	@git push --tags
	@echo "Publishing to NPM"
	@npm publish
