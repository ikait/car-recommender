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
    self.manufacturer = [];

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
        cars.cartype = cartype;
        cars.forEach(function (e) {
          var car = new Car(e);
          car.cartype = cartype;
          car.parent = self;  // 親(CarRecommendation)に辿れるようにしておく
          self.cars.push(car);

          if (self.manufacturer.indexOf(e.manufacturer) === -1) {
            self.manufacturer.push(e.manufacturer);
          }
        });
      }
      self.view.showManufacturer();
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

  // 似ている車の入った配列を返す
  CarRecommendation.prototype.getSimilarityCars = function (car, limit) {
    var self = this;
    var similarities = car.similarities;
    var limit = limit || self.cars.length - 1;  // 制限がなければ自分以外すべて返す

    return (function () {
      var cars = [];
      for (var i = 0; i < limit; i += 1) {
        cars.push(similarities[i].car);
      }
      return cars;
    }());
  };


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

    // サイズを初期化
    var size = 0;

    // 部位の指定があれば
    if (where) {
      if (this.values && this.values[where]) {
        size = +this.values[where].replace(/,/g, '') * metre_ratio;
      }
    // 部位の指定がなければ
    } else {
      size = {};
      item.forEach(function (e, i) {
        if (this.values && this.values[where]) {
          size[e] = +this.values[where].replace(/,/g, '') * metre_ratio;
        }
      });
    }
    return size;
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

    // サイズが取得できた場合は足し算する
    if (c1.length && c1.height && c2.length && c2.height) {
      score += (
        1 / ( 1 +
          Math.sqrt(
            Math.pow(c1.length - c2.length, 2) + Math.pow(c1.height - c2.height, 2)
          )
        )
      );
    }

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
    this.condition_manufacturer_ID = "condition_manufacturer";

    this.users_car;
    this.selected_cars;

    this.japanese_car = [
      "ホンダ", "三菱", "ダイハツ", "スズキ",
      "スバル", "マツダ", "日産", "トヨタ",
      "光岡", "レクサス"
    ]

    this.listen();
  };


  // メーカーのチェックボックスを作って表示
  View.prototype.showManufacturer = function () {
    var self = this;

    var $condition_manufacturer = $('#' + self.condition_manufacturer_ID);
    $condition_manufacturer.empty();
    self.app.manufacturer.forEach(function (e) {
      $('<label>').append(
        $('<input>').attr({
          'type': 'checkbox',
          'value': e
        })
      ).append(e).appendTo( $condition_manufacturer );
    });


    // 全選択解除ボタンを生成
    $('<input>').attr({
      'type': 'button',
      'value': '全選択解除 (全候補から検索する)'
    }).on('click', function (e) {
      $('input[type="checkbox"]', $condition_manufacturer).each(function () {
        $(this).prop('checked', false);
      });
    }).prependTo( $condition_manufacturer );

    // 国産車全選択ボタンを生成
    $('<input>').attr({
      'type': 'button',
      'value': '国産車を全て選択'
    }).on('click', function (e) {
      $('input[type="checkbox"]', $condition_manufacturer).each(function () {
        if ( self.japanese_car.indexOf( $(this).val() ) !== -1 ) {
          $(this).prop('checked', true);
        } else {
          $(this).prop('checked', false)
        }
      });
    }).prependTo( $condition_manufacturer );

    // 輸入車全選択ボタンを生成
    $('<input>').attr({
      'type': 'button',
      'value': '輸入車を全て選択'
    }).on('click', function (e) {
      $('input[type="checkbox"]', $condition_manufacturer).each(function () {
        if ( self.japanese_car.indexOf( $(this).val() ) === -1 ) {
          $(this).prop('checked', true);
        } else {
          $(this).prop('checked', false);
        }
      });
    }).prependTo( $condition_manufacturer );


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
  View.prototype.showCars = function (cars, selected_car) {
    var self = this;
    jQuery(function ($) {

      // 条件でフィルターする
      var filtered_cars = [];  // 条件に適合する車をいれていく
      var checked_manufacturer = [];
      var $condition_manufacturer = $('#' + self.condition_manufacturer_ID);

      $('input', $condition_manufacturer).each(function () {
        if ($(this).prop('checked')) {
          checked_manufacturer.push( $(this).val() );
        }
      });

      // もしなにかメーカーがチェックされていればそこから絞る
      if (checked_manufacturer.length) {
        for (var i = 0, max = cars.length; i < max; i += 1) {
          var car = cars[i];
          if (checked_manufacturer.indexOf(car.values.manufacturer) !== -1) {
            filtered_cars.push(cars[i]);
          }
        }
      } else {  // メーカーのチェックがなければ全候補
        filtered_cars = cars;
      }

      // 登録
      self.users_car = (selected_car) ? selected_car : self.users_car;

      // 選択した車の指定があれば先頭に追加
      filtered_cars = (self.users_car) ? [self.users_car].concat(filtered_cars) : filtered_cars;

      // 結果を一度リセット
      var $result = $('#' + self.search_result_ID);
      $result.empty();

      // 表示する量。選択されていたら最大値+1 (つまり選択した車を除くと最大値になる)
      var amount = (self.users_car) ? self.search_limit + 1 : self.search_limit;

      for (var i = 0, j = amount; i < j; i += 1) {
        var car = filtered_cars[i];
        // 選択した車の指定があればクラスを追加
        var cls = (self.users_car && i === 0) ? "selected" : "";

        var n = (self.users_car) ? i : i + 1;  // 何番目?
        var no = (self.users_car && n === 0) ? "選択" : n;  // 1番目は選択した車

        if (car) {
          $result.append(
            $('<tr>').append(
              $('<td>').html([
                '<span class="no">' + no + '</span><br>',
                '<span class="rank">', car.values.ranking, '位</span>'
              ]),
              // $('<td>').text(car.values.ranking),
              $('<td>').append($('<img>').attr('src', car.values.image)),
              $('<td>').html([
                '<span class="manufacturer">', car.values.manufacturer, '</span><br>',
                '<span class="name">', car.values.name, '</span><br>',
                '<span class="new_car_price">新車価格<strong>', car.values.new_car_price, '</strong>万円</span>',
                '<span class="used_car_price">中古車価格<strong>', car.values.used_car_price, '</strong>万円</span><br>',
                '<span class="url"><a href="', car.values.url, '" target="_blank">', car.values.url, '</a></span>',
              ].join('')),
              $('<td>').html([
                '<span class="power">', car.values.power, '</span><br>',
                '<span class="drive_system">', car.values.drive_system, '</span><br>',
                '<span class="transmission">', car.values.transmission, '</span><br>',
                '<span class="sale_status">', car.values.sale_status, '</span>'
              ].join(''))
            ).data(car).addClass(cls)
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
        self.selected_cars = cars;
        self.users_car = null;  // 検索されたら選択中の車をクリア
        self.showCars(cars);
      });

      // 選んだりするのを書いていく?
      var $search_search = $('#' + self.search_result_ID);
      $search_search.on('click', 'tr', function (e) {
        var car = $(this).data();

        // 車を選択したら、「自分の車検索」でヒットした候補以外も含む全ての類似候補を取得
        self.selected_cars = self.app.getSimilarityCars( car );
        self.showCars( self.selected_cars, car );
      });

      // 条件が変更されたとき
      var $condition_manufacturer = $('#' + self.condition_manufacturer_ID);
      $condition_manufacturer.on('click', 'input', function () {

        // すでに候補が用意されていれば
        (self.selected_cars) && self.showCars(self.selected_cars);
      });

    });
  };

  // 実行!
  (new CarRecommendation()).init();

}(document, window, $));
