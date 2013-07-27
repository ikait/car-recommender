import datetime

from scrapy.contrib.spiders import CrawlSpider, Rule
from scrapy.contrib.linkextractors.sgml import SgmlLinkExtractor
from scrapy.selector import HtmlXPathSelector
from scrapy.http.request import Request
from scrapy import log
from crawl.items import *


class CrawlCar(CrawlSpider):
    name = "car"

    def __init__(self, bodytype="kei-car", *args, **kwargs):
        self.allowed_domains = ['kakaku.com']
        self.start_urls = ['http://kakaku.com/kuruma/ranking/bodytype=%s/page=1/' % bodytype]
        self.rules = (
            # Rule(SgmlLinkExtractor(allow=('/item/K\d+/catalog/GradeID=\d+/'), restrict_xpaths='//div[@id="tabContents"]/table/tbody/tr[2]/td[1]'), follow=False, callback="parse_car"),
            Rule(SgmlLinkExtractor(allow=('/item/K\d+/catalog/')), follow=False, callback="parse_catalog"),
            Rule(SgmlLinkExtractor(allow=('/kuruma/ranking/bodytype=%s/page=\d+/' % bodytype.replace('-', '%2D'), ), ), follow=True),
        )
        super(CrawlCar, self).__init__()

    def parse_catalog(self, response):
        hxs = HtmlXPathSelector(response)
        status = hxs.select('//div[@id="tabContents"]/table')

        if status:
            if len(status) > 1:
                href = hxs.select('//div[@id="tabContents"]/table[1]/tbody/tr[2]/td[1]/a/@href').extract()[0]
                self.log('plural!\n %s' % href)
                yield Request("http://kakaku.com" + href, self.parse_grade)
            else:
                href = hxs.select('//div[@id="tabContents"]/table/tbody/tr[2]/td[1]/a/@href').extract()[0]
                self.log('singular!\n %s' % href)
                yield Request("http://kakaku.com" + href, self.parse_grade)
        else:
            yield Request(response.url, self.parse_unconfirmed)

    def parse_unconfirmed(self, response):
        self.log('unconfirmed: %s parsing...' % response.url)

        date = datetime.datetime.today()

        hxs = HtmlXPathSelector(response)
        title = hxs.select('//div[@id="titleBox"]')

        car = GasolineCar()
        car["url"] = response.url
        car["acquisition_date"] = date.strftime("%Y-%m-%d %H:%M:%S")

        car["manufacturer"] = title.select('p[@id="makerName"]/text()').extract()[0]
        car["name"] = title.select('h2/text()').extract()[0]

        car["image"] = hxs.select('//div[@id="imgBox"]//img/@src').extract()[0]
        car["new_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[0]
        car["used_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[1]

        rating_value = hxs.select('//span[@itemprop="ratingValue"]/text()').extract()
        car["rating_value"] = rating_value[0] if len(rating_value) > 0 else 0
        car["rating_count"] = hxs.select('//span[@itemprop="reviewCount"]/text()').extract()[0]
        car["ranking"] = hxs.select('//li[@class="ranking"]/a/span[@class="num"]/text()').extract()[0]

        yield car

    def parse_grade(self, response):
        self.log('grade: %s parsing...' % response.url)

        date = datetime.datetime.today()

        hxs = HtmlXPathSelector(response)
        title = hxs.select('//div[@id="titleBox"]')
        spec = hxs.select('//table[@class="specTbl"]/tbody')

        power = spec.select('tr[8]/td[4]/text()').extract()[0]

        # electric
        if power == u'\u96fb\u6c17':
            car = ElectricCar()

            car["url"] = response.url
            car["acquisition_date"] = date.strftime("%Y-%m-%d %H:%M:%S")

            car["manufacturer"] = title.select('p[@id="makerName"]/text()').extract()[0]
            car["name"] = title.select('h2/text()').extract()[0]

            car["image"] = hxs.select('//div[@id="imgBox"]//img/@src').extract()[0]
            car["new_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[0]
            car["used_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[1]

            rating_value = hxs.select('//span[@itemprop="ratingValue"]/text()').extract()
            car["rating_value"] = rating_value[0] if len(rating_value) > 0 else 0
            car["rating_count"] = hxs.select('//span[@itemprop="reviewCount"]/text()').extract()[0]
            car["ranking"] = hxs.select('//li[@class="ranking"]/a/span[@class="num"]/text()').extract()[0]

            car["release_date"] = spec.select('tr[2]/td[2]/text()').extract()[0]
            car["sale_division"] = spec.select('tr[2]/td[4]/text()').extract()[0]
            car["sale_status"] = spec.select('tr[3]/td[2]/text()').extract()[0]
            car["model"] = spec.select('tr[3]/td[4]/text()').extract()[0]
            car["drive_system"] = spec.select('tr[4]/td[2]/text()').extract()[0]
            car["transmission"] = spec.select('tr[4]/td[4]/text()').extract()[0]
            car["riding_capacity"] = spec.select('tr[5]/td[2]/text()').extract()[0]
            car["handle_position"] = spec.select('tr[5]/td[4]/text()').extract()[0]
            car["full_length"] = spec.select('tr[6]/td[2]/text()').extract()[0]
            car["full_width"] = spec.select('tr[6]/td[4]/text()').extract()[0]
            car["full_height"] = spec.select('tr[7]/td[2]/text()').extract()[0]
            car["car_weight"] = spec.select('tr[7]/td[4]/text()').extract()[0]
            car["minimum_turning_radius"] = spec.select('tr[8]/td[2]/text()').extract()[0]
            car["power"] = spec.select('tr[8]/td[4]/text()').extract()[0]

            car["battery_capacity"] = spec.select('tr[10]/td[2]/text()').extract()[0]
            car["running_distance"] = spec.select('tr[10]/td[4]/text()').extract()[0]
            car["charging_time_100v"] = spec.select('tr[11]/td[2]/text()').extract()[0]
            car["charging_time_200v"] = spec.select('tr[11]/td[4]/text()').extract()[0]
            car["charging_time_rapid"] = spec.select('tr[12]/td[2]/text()').extract()[0]

            car["motor_maximum_output"] = spec.select('tr[12]/td[4]/text()').extract()[0]
            car["motor_maximum_torque"] = spec.select('tr[13]/td[2]/text()').extract()[0]

            car["antilock_brake_system"] = spec.select('tr[15]/td[2]/text()').extract()[0]
            car["electronic_stability_control"] = spec.select('tr[15]/td[4]/text()').extract()[0]
            car["airbag"] = spec.select('tr[16]/td[2]/text()').extract()[0]
            car["side_airbag"] = spec.select('tr[16]/td[4]/text()').extract()[0]
            car["curtain_airbag"] = spec.select('tr[17]/td[2]/text()').extract()[0]
            car["idle_reduction"] = spec.select('tr[17]/td[4]/text()').extract()[0]
            car["cruise_control"] = spec.select('tr[18]/td[2]/text()').extract()[0]
            car["car_navigation_system"] = spec.select('tr[18]/td[4]/text()').extract()[0]

            front_wheel_size = spec.select('tr[20]/td[2]/a/text()').extract()
            car["front_wheel_size"] = front_wheel_size[0] if len(front_wheel_size) > 0 else 0
            rear_wheel_size = spec.select('tr[20]/td[4]/a/text()').extract()
            car["rear_wheel_size"] = rear_wheel_size[0] if len(rear_wheel_size) > 0 else 0

            car["available_colors"] = spec.select('tr[22]/td/ul/li/text()').extract()
            car["ecocar_tax_reduction"] = spec.select('tr[24]/td[2]/text()').extract()[0]
            car["car_acquisition_tax"] = spec.select('tr[24]/td[4]/text()').extract()[0]
            car["car_weight_tax"] = spec.select('tr[25]/td[2]/text()').extract()[0]
            car["next_year_car_tax"] = spec.select('tr[25]/td[4]/text()').extract()[0]

        # hybrid
        elif power == u'\u30cf\u30a4\u30d6\u30ea\u30c3\u30c9':
            car = HybridCar()

            car["url"] = response.url
            car["acquisition_date"] = date.strftime("%Y-%m-%d %H:%M:%S")

            car["manufacturer"] = title.select('p[@id="makerName"]/text()').extract()[0]
            car["name"] = title.select('h2/text()').extract()[0]

            car["image"] = hxs.select('//div[@id="imgBox"]//img/@src').extract()[0]
            car["new_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[0]
            car["used_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[1]

            rating_value = hxs.select('//span[@itemprop="ratingValue"]/text()').extract()
            car["rating_value"] = rating_value[0] if len(rating_value) > 0 else 0
            car["rating_count"] = hxs.select('//span[@itemprop="reviewCount"]/text()').extract()[0]
            car["ranking"] = hxs.select('//li[@class="ranking"]/a/span[@class="num"]/text()').extract()[0]

            car["release_date"] = spec.select('tr[2]/td[2]/text()').extract()[0]
            car["sale_division"] = spec.select('tr[2]/td[4]/text()').extract()[0]
            car["sale_status"] = spec.select('tr[3]/td[2]/text()').extract()[0]
            car["model"] = spec.select('tr[3]/td[4]/text()').extract()[0]
            car["drive_system"] = spec.select('tr[4]/td[2]/text()').extract()[0]
            car["transmission"] = spec.select('tr[4]/td[4]/text()').extract()[0]
            car["riding_capacity"] = spec.select('tr[5]/td[2]/text()').extract()[0]
            car["handle_position"] = spec.select('tr[5]/td[4]/text()').extract()[0]
            car["full_length"] = spec.select('tr[6]/td[2]/text()').extract()[0]
            car["full_width"] = spec.select('tr[6]/td[4]/text()').extract()[0]
            car["full_height"] = spec.select('tr[7]/td[2]/text()').extract()[0]
            car["car_weight"] = spec.select('tr[7]/td[4]/text()').extract()[0]
            car["minimum_turning_radius"] = spec.select('tr[8]/td[2]/text()').extract()[0]
            car["power"] = spec.select('tr[8]/td[4]/text()').extract()[0]
            car["kmperliter_with_jc08mode"] = spec.select('tr[9]/td[2]/text()').extract()[0]
            car["kmperliter_with_1015mode"] = spec.select('tr[9]/td[4]/text()').extract()[0]
            car["fuel_efficiency_achievement_rate"] = spec.select('tr[10]/td[2]/text()').extract()[0]
            car["cylinder_capacity"] = spec.select('tr[12]/td[2]/text()').extract()[0]
            car["fuel_type"] = spec.select('tr[12]/td[4]/text()').extract()[0]
            car["fuel_tank_capacity"] = spec.select('tr[13]/td[2]/text()').extract()[0]
            car["supercharger"] = spec.select('tr[13]/td[4]/text()').extract()[0]
            car["maximum_output"] = spec.select('tr[14]/td[2]/text()').extract()[0]
            car["maximum_torque"] = spec.select('tr[14]/td[4]/text()').extract()[0]

            car["motor_maximum_output"] = spec.select('tr[16]/td[2]/text()').extract()[0]
            car["motor_maximum_torque"] = spec.select('tr[16]/td[4]/text()').extract()[0]

            car["antilock_brake_system"] = spec.select('tr[18]/td[2]/text()').extract()[0]
            car["electronic_stability_control"] = spec.select('tr[18]/td[4]/text()').extract()[0]
            car["airbag"] = spec.select('tr[19]/td[2]/text()').extract()[0]
            car["side_airbag"] = spec.select('tr[19]/td[4]/text()').extract()[0]
            car["curtain_airbag"] = spec.select('tr[20]/td[2]/text()').extract()[0]
            car["idle_reduction"] = spec.select('tr[20]/td[4]/text()').extract()[0]
            car["cruise_control"] = spec.select('tr[21]/td[2]/text()').extract()[0]
            car["car_navigation_system"] = spec.select('tr[21]/td[4]/text()').extract()[0]

            front_wheel_size = spec.select('tr[23]/td[2]/a/text()').extract()
            car["front_wheel_size"] = front_wheel_size[0].strip() if len(front_wheel_size) > 0 else 0
            rear_wheel_size = spec.select('tr[23]/td[4]/a/text()').extract()
            car["rear_wheel_size"] = rear_wheel_size[0].strip() if len(rear_wheel_size) > 0 else 0

            car["available_colors"] = spec.select('tr[25]/td/ul/li/text()').extract()
            car["ecocar_tax_reduction"] = spec.select('tr[27]/td[2]/text()').extract()[0]
            car["car_acquisition_tax"] = spec.select('tr[27]/td[4]/text()').extract()[0]
            car["car_weight_tax"] = spec.select('tr[28]/td[2]/text()').extract()[0]
            car["next_year_car_tax"] = spec.select('tr[28]/td[4]/text()').extract()[0]

        # other (maybe gasoline)
        else:
            car = GasolineCar()

            car["url"] = response.url
            car["acquisition_date"] = date.strftime("%Y-%m-%d %H:%M:%S")

            car["manufacturer"] = title.select('p[@id="makerName"]/text()').extract()[0]
            car["name"] = title.select('h2/text()').extract()[0]

            car["image"] = hxs.select('//div[@id="imgBox"]//img/@src').extract()[0]
            car["new_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[0]
            car["used_car_price"] = hxs.select('//div[@id="productInfoBox"]//span[@class="price"]/text()').extract()[1]

            rating_value = hxs.select('//span[@itemprop="ratingValue"]/text()').extract()
            car["rating_value"] = rating_value[0] if len(rating_value) > 0 else 0
            car["rating_count"] = hxs.select('//span[@itemprop="reviewCount"]/text()').extract()[0]
            car["ranking"] = hxs.select('//li[@class="ranking"]/a/span[@class="num"]/text()').extract()[0]

            car["release_date"] = spec.select('tr[2]/td[2]/text()').extract()[0]
            car["sale_division"] = spec.select('tr[2]/td[4]/text()').extract()[0]
            car["sale_status"] = spec.select('tr[3]/td[2]/text()').extract()[0]
            car["model"] = spec.select('tr[3]/td[4]/text()').extract()[0]
            car["drive_system"] = spec.select('tr[4]/td[2]/text()').extract()[0]
            car["transmission"] = spec.select('tr[4]/td[4]/text()').extract()[0]
            car["riding_capacity"] = spec.select('tr[5]/td[2]/text()').extract()[0]
            car["handle_position"] = spec.select('tr[5]/td[4]/text()').extract()[0]
            car["full_length"] = spec.select('tr[6]/td[2]/text()').extract()[0]
            car["full_width"] = spec.select('tr[6]/td[4]/text()').extract()[0]
            car["full_height"] = spec.select('tr[7]/td[2]/text()').extract()[0]
            car["car_weight"] = spec.select('tr[7]/td[4]/text()').extract()[0]
            car["minimum_turning_radius"] = spec.select('tr[8]/td[2]/text()').extract()[0]
            car["power"] = spec.select('tr[8]/td[4]/text()').extract()[0]
            car["kmperliter_with_jc08mode"] = spec.select('tr[9]/td[2]/text()').extract()[0]
            car["kmperliter_with_1015mode"] = spec.select('tr[9]/td[4]/text()').extract()[0]
            car["fuel_efficiency_achievement_rate"] = spec.select('tr[10]/td[2]/text()').extract()[0]
            car["cylinder_capacity"] = spec.select('tr[12]/td[2]/text()').extract()[0]
            car["fuel_type"] = spec.select('tr[12]/td[4]/text()').extract()[0]
            car["fuel_tank_capacity"] = spec.select('tr[13]/td[2]/text()').extract()[0]
            car["supercharger"] = spec.select('tr[13]/td[4]/text()').extract()[0]
            car["maximum_output"] = spec.select('tr[14]/td[2]/text()').extract()[0]
            car["maximum_torque"] = spec.select('tr[14]/td[4]/text()').extract()[0]
            car["antilock_brake_system"] = spec.select('tr[16]/td[2]/text()').extract()[0]
            car["electronic_stability_control"] = spec.select('tr[16]/td[4]/text()').extract()[0]
            car["airbag"] = spec.select('tr[17]/td[2]/text()').extract()[0]
            car["side_airbag"] = spec.select('tr[17]/td[4]/text()').extract()[0]
            car["curtain_airbag"] = spec.select('tr[18]/td[2]/text()').extract()[0]
            car["idle_reduction"] = spec.select('tr[18]/td[4]/text()').extract()[0]
            car["cruise_control"] = spec.select('tr[19]/td[2]/text()').extract()[0]
            car["car_navigation_system"] = spec.select('tr[19]/td[4]/text()').extract()[0]

            front_wheel_size = spec.select('tr[21]/td[2]/a/text()').extract()
            car["front_wheel_size"] = front_wheel_size[0].strip() if len(front_wheel_size) > 0 else 0
            rear_wheel_size = spec.select('tr[21]/td[4]/a/text()').extract()
            car["rear_wheel_size"] = rear_wheel_size[0].strip() if len(rear_wheel_size) > 0 else 0

            car["available_colors"] = spec.select('tr[23]/td/ul/li/text()').extract()
            car["ecocar_tax_reduction"] = spec.select('tr[25]/td[2]/text()').extract()[0]
            car["car_acquisition_tax"] = spec.select('tr[25]/td[4]/text()').extract()[0]
            car["car_weight_tax"] = spec.select('tr[26]/td[2]/text()').extract()[0]
            car["next_year_car_tax"] = spec.select('tr[26]/td[4]/text()').extract()[0]

        # if not car["sale_status"] == u'\u8ca9\u58f2\u7d42\u4e86':
        #     yield car

        yield car
