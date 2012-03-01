SHELL := /bin/bash

test:
	@node -e "require('urun')('test');"

.PHONY: test
