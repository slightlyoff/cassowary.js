build:
	cd util; ./build.sh

test:
	npm test

parser:
	./node_modules/pegjs/bin/pegjs \
		-e "__cassowary_parser" \
		src/parser/grammar.pegjs src/parser/parser.js

.PHONY: test
