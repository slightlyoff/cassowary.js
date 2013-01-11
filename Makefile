all: parser test build

build:
	cd util; ./build.sh

test:
	npm test

dist: build
	rm -rf dist/cassowary/
	mkdir -p dist/cassowary/
	cp -r LICENSE bin package.json dist/cassowary/
	cd dist; tar -zcf cassowary.tar.gz cassowary

parser:
	./node_modules/pegjs/bin/pegjs \
		-e "__cassowary_parser" \
		src/parser/grammar.pegjs src/parser/parser.js

.PHONY: test
