;(function (document, window, $) {

  //----------------------------------------------------------------------/
  // jsonの読み込みから全体の管理を行う CarRecommendation
  //----------------------------------------------------------------------/
  var CarRecommendation = function () {
    this.view = new View(this);  // ブラウザ[に表示/を操作]するためのクラス。下の方
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
    }).then(function () {  // carの用意が終わったら
      console.dir(self.cars);
      loading.hide();
    }).then(function () {

    });
  };

  CarRecommendation.prototype.buildCars = function (cars) {
    var self = this;
    self.cars = [];
    self.jsons = [];

    var deferreds = [], cartypes = [];

    for (var cartype in cars) {
      cartypes.push(cartype);
      deferreds.push($.ajax(cars[cartype]));
    }

    // 複数のjsonを読み込み終えてから次の処理にいくために、Deferredオブジェクトを返す
    return $.when.apply($, deferreds).then(function () {  // 並行して複数のjsonを読み込む

      // $.when:
      // 引数で与えられた全てのDeferredオブジェクトがresolveされたらresolveするメソッド
      // ※$.whenは引数を配列の形でとれないので、上ではapplyで配列を分けて渡した
      //
      // $.then:
      // resolveされたら引数に与えられたfunctionを実行するメソッド
      // functionが終わったらresolveするので、.then().then()のように続けて書ける
      for (var i = 0, j = arguments.length; i < j; i += 1) {  // argumentsにはwhenの結果が入っている
        // jsonに書いてある車の数だけnew Car()をして車をつくる
        // self.cars配列に車を全部いれる
        var cars = arguments[i][0];
        var cartype = cartypes[i];
        self.jsons.push(cars);
        cars.cartype = cartype;
        cars.forEach(function (e) {
          var car = new Car(e);
          car.cartype = cartype;
          car.parent = self;  // 親(CarRecommendation)に辿れるようにしておく
          self.cars.push(car);
        });
      }
    }).then(function () {  // 上のJSONが読み込み終わったとき(then)
      // 自分以外と比べてスコアを計算する
      self.cars.forEach(function (car) {
        self.cars.forEach(function (car2) {
          if (car !== car2) {
            var score = car.getSimilarityScore(car2);
          }
        });
      });
    }).then(function () {  // スコアの計算が終わったとき
      // それぞれのCarについて、自分と似てる順(similarity.scoreの高い順)にソートする
      self.cars.forEach(function (e, i, cars) {
        cars[i].similarities.sort(function (a, b) {
          return (a.score > b.score) ? -1 : 1;
        });
      });
    });
  };

  // 与えられたcarの配列を、ランキング順にソートして返す
  CarRecommendation.prototype.getSortedCarsByRanking = function (cars) {
    var cars = cars || self.cars;
    cars.sort(function (a, b) {
      return (+a.values.ranking < +b.values.ranking) ? -1 : 1;
    });
    return cars;
  };

  // 与えられた文字列、条件(オブジェクト)をもとにcarを検索し、該当するcarの入った配列を返す
  // condition: cartype
  CarRecommendation.prototype.getCarsSearchResult = function (str, condition, cars) {
    var self = this;
    var cars = cars || self.cars;

    // 1. すべての(もしくは第3引数で渡された)車たちを検索対象とする
    // 2. 条件にあてはまらないものを除く
    // 3. 残ったものを結果として返す
    var results = cars.slice();  // 配列をそのままコピー

    // 検索文字列。前後の空白を削除し, 小文字化
    var query_string = (str) ? str.replace(/^\s*(.*?)\s*$/, "$1").toLowerCase() : "";

    // 検索文字列での検索
    if (query_string) {
      for (var i = 0, j = results.length; i < j; i += 1) {
        if (results[i] && results[i].values) {
          var name = results[i].values.name.toLowerCase();
          var manufacturer = results[i].values.manufacturer.toLowerCase();

          // string.indexOf(パターン)は、パターンがstringにないときに-1を返す
          if (name.indexOf(query_string) === -1 &&
              manufacturer.indexOf(query_string) === -1) {
            results.splice(i, 1);
            i -= 1;  // 消した分ひとつ戻る
          }
        }
      }
    }

    // 条件での検索 (cartype)
    if (condition && condition.cartype) {
      for (var i = 0, j = results.length; i < j; i += 1) {
        if (results[i] && results[i].values) {
          var cartype = results[i].cartype;
          if (cartype !== condition.cartype) {
            results.splice(i, 1);
            i -= 1;  // 消した分ひとつ戻る
          }
        }
      }
    }

    return self.getSortedCarsByRanking(results);  // carの配列
  };

  // 検索する
  CarRecommendation.prototype.searchCars = function (str, condition, cars) {
    return this.getCarsSearchResult(str, condition, cars);
  };

  // carを選ぶ
  CarRecommendation.prototype.chooseCar = function () {};


  //----------------------------------------------------------------------/
  // 自動車のオブジェクト Car
  // これが何千個newして作られる
  //----------------------------------------------------------------------/
  var Car = function (obj) {
    this.values = obj;
    this.similarities = [];
  };

  // 全長、全幅、全高をメートルの整数で取得する (引数なしだと3つが入ったオブジェクトで返す)
  Car.prototype.getSizeWithMetre = function (where) {
    var item = ["full_length", "full_height", "full_width"];
    var metre_ratio = 0.001;
    var size;
    if (where) {
      if (this.values && this.values[where]) {
        size = +this.values[where].replace(/,/g, '') * metre_ratio;
      }
    } else {
      size = {};
      item.forEach(function (e, i) {
        if (this.values && this.values[where]) {
          size[e] = +this.values[where].replace(/,/g, '') * metre_ratio;
        }
      });
    }
    return (size) ? size : {};
  };

  // 自分と、与えられた車の類似値を比較して、覚えておく (ついでにスコアを返す)
  Car.prototype.getSimilarityScore = function (cmpcar) {
    var self = this;  // 自分: self  比較する車: cmpcar
    var score = 0, similarity = {};

    // ボディタイプが一緒であれば +1
    score += (self.cartype === cmpcar.cartype) ? 1 : 0;

    // 動力分類が一緒であれば +1
    score += (self.values.power === cmpcar.values.power) ? 1 : 0;

    // 駆動方式が一緒であれば +1
    score += (self.values.drive_system === cmpcar.values.drive_system) ? 1 : 0;

    // 色について
    // 選択できる色の一致率 (0〜1)
    //


    // 全長と全幅でユークリッド距離を求めそのまま足す
    var c1 = {}, c2 = {};
    c1.length = self.getSizeWithMetre("full_length");
    c1.height = self.getSizeWithMetre("full_height");
    c2.length = cmpcar.getSizeWithMetre("full_length");
    c2.height = cmpcar.getSizeWithMetre("full_height");
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
    return similarity.score;  // スコアを返す(一応)
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
    this.search_cartype_select_ID = "search_cartype";
    this.listen();
  };

  // メッセージ用のdivを生成する。msgにメッセージの内容、id, classは任意
  View.prototype.createMessageDiv = function (msg, id, klass) {
    var self = this;
    self.messages = self.messages || [];

    var Message = function (msg, id) {
      this.msg = msg || "Loading";
      this.id = id || "msg" + Math.floor(Math.random() * 100000);
      // "class"が予約語で使えないのでklass..
      this.klass = self.message_div_class + ((klass) ? " " + klass : "");  // classを追加できるように
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

  // 引数にcarの入った配列をとり、それらを表示する
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

  // ブラウザの操作をリッスン!
  View.prototype.listen = function () {
    var self = this;
    jQuery(function ($) {

      // 検索について。keyup or keypressされたら, その時点の入力文字列で検索
      var $search_box = $('#' + self.search_box_ID);
      var $search_cartype = $('#' + self.search_cartype_select_ID);

      $search_box.add( $search_cartype )
      .on('keyup keypress change', function () {
        var str = $search_box.val();
        var cartype = $search_cartype.val();

        var cars = self.app.searchCars(str, {
          cartype: cartype
        });
        self.showCars(cars);
      });

      // 選んだりするのを書いていく?
    });
  };

  // 実行!
  (new CarRecommendation()).init();

}(document, window, $));
