//----------------------------------------------------------------------/
// jsonの読み込みから全体の管理を行う CarRecommendation
//----------------------------------------------------------------------/
var CarRecommendation = function () {
  this.cars = null;  // 最初はなにもいれない
  this.view = new View(this);  // ブラウザ[に表示/を操作]するためのクラス。下の方
};

CarRecommendation.prototype.init = function () {
  var self = this;

  var loading = self.view.createMessageDiv("準備中");
  loading.show("計算開始");

  self.getCarsFromJSONs({
    "kei-car":      "../crawl/json/kei-car.json",
    "coupe":        "../crawl/json/coupe.json",
    "compact":      "../crawl/json/compact.json",
    "minivan":      "../crawl/json/minivan.json",
    "open":         "../crawl/json/open.json",
    "sedan":        "../crawl/json/sedan.json",
    "stationwagon": "../crawl/json/stationwagon.json",
    "suv":          "../crawl/json/suv.json"
  }).then(function (cars) {
    // 類似スコア算出、ソートの並列処理を開始する
    var worker = new Worker('../lib/calccarscore.js');
    worker.postMessage(cars);
    worker.onmessage = function(event) {
      self.cars = event.data;
      loading.hide("計算完了");
    };
  }).then(function () {

  });

  // self.buildCars({
  //   "kei-car":      "../crawl/json/kei-car.json",
  //   "coupe":        "../crawl/json/coupe.json",
  //   "compact":      "../crawl/json/compact.json",
  //   "minivan":      "../crawl/json/minivan.json",
  //   "open":         "../crawl/json/open.json",
  //   "sedan":        "../crawl/json/sedan.json",
  //   "stationwagon": "../crawl/json/stationwagon.json",
  //   "suv":          "../crawl/json/suv.json"
  // }).then(function (e) {  // carの用意が終わったら
  //   console.dir(self.cars);
  //   loading.hide();
  // }).then(function () {
  // });

};

CarRecommendation.prototype.getCarsFromJSONs = function (jsons) {
  var self = this;
  loaded_cars = [];

  var deferreds = [], cartypes = [];

  for (var cartype in jsons) {
    cartypes.push(cartype);
    deferreds.push($.ajax(jsons[cartype]));
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
      // loaded_cars配列に車を全部いれる
      var cars = arguments[i][0];
      var cartype = cartypes[i];
      cars.cartype = cartype;
      cars.forEach(function (e) {
        var car = new Car(e);
        car.cartype = cartype;
        car.parent = self;  // 親(CarRecommendation)に辿れるようにしておく
        loaded_cars.push(car);
      });
    }
    return loaded_cars;
  });
};

CarRecommendation.prototype.buildCars = function (cars) {
  var self = this;
  self.cars = [];

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
    return self.cars;
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
// エラーのときはfalseを返す
// condition: cartype
CarRecommendation.prototype.getCarsSearchResult = function (str, condition, cars) {
  var self = this;

  // carsの指定がなければself.carsを代入
  // もしself.carsがなかったら(まだスコア計算が終わっていなかったら)falseを返す
  var cars = cars || (self.cars) ? self.cars : false;
  if (!cars) return false;  // エラー

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


// 実行!
(new CarRecommendation()).init();
