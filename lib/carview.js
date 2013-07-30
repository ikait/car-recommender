//----------------------------------------------------------------------/
// ブラウザ表示/操作に関する部分 View
//----------------------------------------------------------------------/
var View = function (app) {
  this.app = app;  // CarRecommendationを受け取る。(主にcars配列を見るために)
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

  Message.prototype.show = function (log) {
    var msg = this;
    var log = log || "";
    jQuery(function ($) {
      $('body').prepend( $('<div>').text(msg.msg).attr({
        'id': msg.id,
        'class': msg.klass
      }));
    });

    console.log("[START]", log, msg, self.messages);
  };

  Message.prototype.hide = function (log) {
    var msg = this;
    var log = log || "";
    jQuery(function ($) {
      $('#' + msg.id).hide();
    });

    // 自分を消しておく  // よく考えると隠すとき消す必要はなかった 07.30
    // for (var i = 0, j = self.messages.length; i < j; i += 1) {
    //   if (self.messages[i] === msg) {
    //     self.messages.splice(i, 1);
    //     break;
    //   }
    // }

    console.log("[_END_]", log, msg, self.messages);
  };

  return (function () {
    var m = new Message(msg, id);
    self.messages.push(m);  // Viewから一斉にon/offできるようにいれておく
    return m;
  })();
};

// 引数にcarの入った配列をとり、それらを表示する
// 配列でなければエラー
View.prototype.showCars = function (cars) {
  var self = this;
  jQuery(function ($) {
    var $result = $('#' + self.search_result_ID);
    $result.empty();

    if (cars instanceof Array) {
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
    } else {
      $result.append("now loading..");

      var callee = arguments.callee;
      setTimeout(function () { self.showCars(cars); }, 1000);
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

