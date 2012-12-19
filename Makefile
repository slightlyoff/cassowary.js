build:
	cd util; ./build.sh

test:
	./node_modules/.bin/mocha --reporter list

.PHONY: test
