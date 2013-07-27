;(function (document, window, $) {

  //----------------------------------------------------------------------/
  // jsonの読み込みから全体の管理を行う CarRecommendation
  //----------------------------------------------------------------------/
  var CarRecommendation = function () {
    this.view = new View(this);
  };

  CarRecommendation.prototype.init = function () {
    var self = this;

    var loading = self.view.createMessageDiv("準備中");
    loading.show();

    self.buildCars({
      "kei-car":      "../crawl/json/kei-car.json",
      "coupe":        "../crawl/json/coupe.json",
      "compact":      "../crawl/json/compact.json",
      "minivan":      "../crawl/json/minivan.json",
      "open":         "../crawl/json/open.json",
      "sedan":        "../crawl/json/sedan.json",
      "stationwagon": "../crawl/json/stationwagon.json",
      "suv":          "../crawl/json/suv.json"
    }).then(function () {  // carの容易が終わったら
      console.dir(self.cars);
      loading.hide();
    }).then(function () {

    });
  };

  CarRecommendation.prototype.buildCars = function (cars) {
    var self = this;
    self.cars = [];
    self.jsons = [];

    var deferreds = [], types = [];

    for (var type in cars) {
      types.push(type);
      deferreds.push($.ajax(cars[type]));
    }

    // 複数のjsonを読み込み終えてから次の処理にいくために、Deferredオブジェクトを返す
    return $.when.apply($, deferreds).then(function () {  // 並行して複数のjsonを読み込む
      // jsonに書いてある車の数だけnew Car()をして車をつくる
      // self.cars配列に車を全部いれる
      for (var i = 0, j = arguments.length; i < j; i += 1) {
        var cars = arguments[i][0];
        var type = types[i];
        self.jsons.push(cars);
        cars.type = type;
        cars.forEach(function (e) {
          var car = new Car(e);
          car.type = type;
          car.parent = self;  // 親(CarRecommendation)に辿れるようにしておく
          self.cars.push(car);
        });
      }
    }).then(function () {
      // 自分以外と比べてスコアを計算する
      self.cars.forEach(function (car) {
        self.cars.forEach(function (car2) {
          if (car !== car2) {
            var score = car.getSimilarityScore(car2);
          }
        });
      });
    }).then(function () {
      // それぞれのCarについて、自分と似てる順(similarity.scoreの高い順)にソートする
      self.cars.forEach(function (e, i, cars) {
        cars[i].similarities.sort(function (a, b) {
          return (a.score > b.score) ? -1 : 1;
        });
      });
    });
  };

  CarRecommendation.prototype.getSortedCarsByRanking = function (cars) {
    var cars = cars || self.cars;
    cars.sort(function (a, b) {
      return (+a.values.ranking < +b.values.ranking) ? -1 : 1;
    });
    return cars;
  };

  CarRecommendation.prototype.getCarsSearchResult = function (str) {
    var self = this;
    var results = [];

    // 検索文字列。前後の空白を削除, 小文字化
    var s = str.replace(/^\s*(.*?)\s*$/, "$1").toLowerCase();
    if (!s) return [];

    // console.log(s, "で検索開始");
    self.cars.forEach(function (car) {
      var name = car.values.name.toLowerCase();
      var manufacturer = car.values.manufacturer.toLowerCase();
      // string.indexOf(パターン)は、パターンがstringにないときに-1を返す
      (name.indexOf(s) !== -1 || manufacturer.indexOf(s) !== -1) && results.push(car);
    });

    return self.getSortedCarsByRanking(results);  // carの配列
  };

  CarRecommendation.prototype.searchCars = function (str) {
    return this.getCarsSearchResult(str);
  };

  CarRecommendation.prototype.chooseCar = function () {};


  //----------------------------------------------------------------------/
  // 自動車のオブジェクト Car
  // これが何千個newして作られる
  //----------------------------------------------------------------------/
  var Car = function (obj) {
    this.values = obj;
    this.similarities = [];
  };

  Car.prototype.getSimilarityScore = function (cmpcar) {
    var self = this;  // 自分: self  比較する車: cmpcar
    var score = 0, similarity = {};

    // ボディタイプが一緒であれば +1
    score += (self.type === cmpcar.type) ? 1 : 0;

    // 動力分類が一緒であれば +1
    score += (self.values.power === cmpcar.values.power) ? 1 : 0;

    // 駆動方式が一緒であれば +1
    score += (self.values.drive_system === cmpcar.values.drive_system) ? 1 : 0;

    // 色について
    // 選択できる色の一致率 (0〜1)


    // 全長と全幅でユークリッド距離を求めそのまま足す
    var c1 = {}, c2 = {};
    c1.length = +self.values.full_length.replace(/,/g, '') * 0.001;
    c1.height = +self.values.full_height.replace(/,/g, '') * 0.001;
    c2.length = +cmpcar.values.full_length.replace(/,/g, '') * 0.001;
    c2.height = +cmpcar.values.full_height.replace(/,/g, '') * 0.001;
    score += (
      1 / ( 1 +
        Math.sqrt(
          Math.pow(c1.length - c2.length, 2) + Math.pow(c1.height - c2.height, 2)
        )
      )
    );

    similarity.score = score;
    similarity.car = cmpcar;

    self.similarities.push(similarity);
    return similarity.score;
  };


  //----------------------------------------------------------------------/
  // ブラウザ表示/操作に関する部分 View
  //----------------------------------------------------------------------/
  var View = function (app) {
    this.app = app;
    this.message_div_class = "message";
    this.search_box_ID = "search";
    this.search_result_ID = "search_result";
    this.search_limit = 20;
    this.listen();
  };

  View.prototype.createMessageDiv = function (msg, id, klass) {
    var self = this;
    self.messages = self.messages || [];

    var Message = function (msg, id) {
      this.msg = msg || "Loading";
      this.id = id || "msg" + Math.floor(Math.random() * 100000);
      // "class"が予約語で使えないのでklass..
      this.klass = self.message_div_class + " " + klass;  // classを追加できるように
      this.status = 0;
    };

    Message.prototype.show = function () {
      var msg = this;
      jQuery(function ($) {
        $('body').prepend( $('<div>').text(msg.msg).attr({
          'id': msg.id,
          'class': msg.klass
        }));
      });
      console.log("[START]", msg.id, msg.msg);
    };

    Message.prototype.hide = function () {
      var msg = this;
      jQuery(function ($) {
        $('#' + msg.id).hide();
      });
      console.log("[_END_]", msg.id, msg.msg);
    };

    return (function () {
      var m = new Message(msg, id);
      self.messages.push(m);  // Viewから一斉にon/offできるようにいれておく
      return m;
    })();
  };

  View.prototype.showCars = function (cars) {
    var self = this;
    jQuery(function ($) {
      var $result = $('#' + self.search_result_ID);
      $result.empty();
      for (var i = 0, j = self.search_limit; i < j; i += 1) {
        var car = cars[i];
        if (car) {
          $result.append(
            $('<tr>').append(
              $('<td>').text(i + 1),
              $('<td>').text(car.values.ranking),
              $('<td>').text(car.values.manufacturer),
              $('<td>').append($('<img>').attr('src', car.values.image)),
              $('<td>').append($('<a>').text(car.values.name).attr('href', car.values.url)),
              $('<td>').text(car.values.power),
              $('<td>').text(car.values.drive_system)
            )
          );
        }
      }
    });
  };

  View.prototype.listen = function () {
    var self = this;
    jQuery(function ($) {

      // 検索について。keyup or keypressされたら, その時点の入力文字列で検索
      $('#' + self.search_box_ID).on('keyup keypress', function () {
        var str = $(this).val();
        self.showCars(self.app.getCarsSearchResult(str));
      });

      // 選んだりするのを書いていく?
    });
  };

  // 実行!
  (new CarRecommendation()).init();

}(document, window, $));
