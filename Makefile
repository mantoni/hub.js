SHELL := /bin/bash

default: lint test phantom browser

name    = "hub"
bin     = node_modules/.bin
tests   = `ls ./test/test-*`
html    = test/all.html
main    = $(shell node -e "console.log(require('./package.json').main)")
version = $(shell node -e "console.log(require('./package.json').version)")
folder  = listen-${version}


lint:
	@node_modules/.bin/autolint --once

.PHONY: test
test:
	@node -e "require('urun')('test');"

phantom:
	@echo "Browserify tests | phantomic"
	@${bin}/browserify ./test/fixture/phantom.js ${tests} | ${bin}/phantomic

browser:
	@echo "Consolify tests > file://`pwd`/${html}"
	@${bin}/consolify ${tests} > ${html}

compile: lint test phantom browser
	@${bin}/browserify ${main} -s ${name} -o ${name}.js
	@${bin}/uglifyjs ${name}.js > ${name}.min.js

package: compile
	@echo "Creating package ${folder}.tgz"
	@mkdir ${folder}
	@mv ${name}.js ${name}.min.js ${folder}
	@cp LICENSE README.md CHANGES.md ${folder}
	@cp test/all.html ${folder}/tests.html
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
