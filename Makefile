SHELL := /bin/bash
PATH  := node_modules/.bin:${PATH}

default: lint test phantom browser

name    = "hub"
tests   = `ls ./test/test-*`
html    = test/all.html
main    = $(shell node -p "require('./package.json').main")
version = $(shell node -p "require('./package.json').version")
folder  = ${name}-${version}


lint:
	@autolint --once

.PHONY: test
test:
	@node -e "require('urun')('test');"

phantom:
	@echo "Browserify tests | phantomic"
	@browserify ./test/fixture/phantom.js ${tests} | phantomic

browser:
	@echo "Consolify tests > file://`pwd`/${html}"
	@consolify --reload -o ${html} ${tests}

compile: lint test phantom browser
	@browserify ${main} -s ${name} -o ${name}.js
	@uglifyjs ${name}.js > ${name}.min.js

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
