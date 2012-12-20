build:
	cd util; ./build.sh

test:
	cd tests; ../node_modules/.bin/mocha --reporter list test.js

parser:
	./node_modules/pegjs/bin/pegjs \
		src/parser/grammar.pegjs src/parser/parser.js

.PHONY: test
