SHELL := /bin/bash

test:
	@node -e "require('urun')('test');"

compile: test
	@nomo

.PHONY: test
