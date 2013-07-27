# クロールしてそのデータをttlに変換するまでの処理
SHELL := /bin/bash

TYPES = kei-car \
				compact \
				minivan \
				stationwagon \
				sedan \
				coupe \
				open \
				suv \

OUTPUT_FORMAT = json

BASE_DIRECTORY = ./$(OUTPUT_FORMAT)

all: $(OUTPUT_FORMAT) beautify

$(OUTPUT_FORMAT):
	test 1 $(foreach type, $(TYPES), \
		&& scrapy crawl car -a bodytype=$(type) -o $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT) -t $(OUTPUT_FORMAT) )

beautify:
	@(echo "beautify started.")
	@($(foreach type, $(TYPES), \
		if [ -w $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT) ] ; then \
			jq "." $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT) > $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT).bak ; \
		fi ; ))
	@($(foreach type, $(TYPES), \
		if [ -w $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT).bak ] ; then \
			rm $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT) ; \
			mv $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT).bak $(BASE_DIRECTORY)/$(type).$(OUTPUT_FORMAT) ; \
		fi ; ))
	@(echo "beautify done.")

clean:
	if [ -d $(CURDIR)/$(OUTPUT_FORMAT) ]; then rm -rf $(CURDIR)/$(OUTPUT_FORMAT) ; fi
