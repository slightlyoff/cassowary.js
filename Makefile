build:
	cd util; ./build.sh

test:
	cd tests; ../node_modules/.bin/mocha --reporter list test.js

.PHONY: test
