require(["jquery", "jquery.tabs", "../../lib/main"], function($) {
  $(function() {

    // タブ
    $("nav").tabs();

    // 2章
    var chapter2 = (function () {

      // Recommendations
      var recommendations = new Recommendations();

      // 2章がsubmitされたときに計算する
      $('#demo-form-chapter2').on('submit', function (e) {
        e.preventDefault();

        var source = JSON.parse( $('[name="source"]', this).first().val() );
        var method = $('[name="method"]:checked', this).val();

        // 2.3.1 / 2.3.2
        var c31_target_a = $('[name="c31_target_a"]', this).first().val();
        var c31_target_b = $('[name="c31_target_b"]', this).first().val();
        var c31_result = recommendations[method](source, c31_target_a, c31_target_b);
        $('[name="c31_result"]', this).first().val(c31_result);

        // 2.3.4
        var c34_target = $('[name="c34_target"]', this).first().val();
        var c34_limit = $('[name="c34_limit"]', this).first().val();
        var c34_result = recommendations.topMatches(source, c34_target, c34_limit, method);
        $('[name="c34_result"]', this).first().html(c34_result.join('<br>'));

        // 2.4
        var c40_target = $('[name="c40_target"]', this).first().val();
        var c40_result = recommendations.getRecommendations(source, c40_target, method);
        $('[name="c40_result"]', this).first().html(c40_result.join('<br>'));

        // 2.5
        var movie_title = 'Superman Returns';
        var movies = recommendations.transformPrefs(source);
        var c50_result = recommendations.topMatches(movies, movie_title);
        $('[name="c50_result"]', this).first().html(movie_title + '<br>' + c50_result.join('<br>'));

        // 2.7
        var itemsim = recommendations.calculateSimilarItems(source);
        $('[name="c70_result"]', this).first().html(JSON.stringify(itemsim));

        // 2.7.2
        var c72_target = $('[name="c72_target"]', this).first().val();
        var c72_result = recommendations.getRecommendedItems(source, itemsim, c72_target);
        $('[name="c72_result"]', this).first().html(c72_result.join('<br>'));
      });

      // textareaに入力されたjsonからオプションを作る
      var initOption = (function ($form) {
        var f = function () {
          var source = JSON.parse( $('[name="source"]', $form).first().val() ) || '';
          var $option = $('<option />');
          $('[name*="target"]', $form).html('');
          for (var name in source) {
            $option.clone().val(name).text(name).appendTo($('[name*="target"]', $form));
          }
        };
        f();
        return f;
      }());

      // textareaが変更されたとき、オプションを作り直す
      $( $('[name="source"]').first() ).on('keyup change', function (e) {
        initOption( $(this).closest('form') );
      });
    }());


    // 5章
    var chapter5 = (function () {

      // Optimization
      var optimization = new Optimization();

      // 解の表現を作成
      var expression = [];

      // 5章のいずれかのボタンがclickされたときに計算
      $('#demo-form-chapter5').on('click', '[name*=submit]', function (e) {
        e.preventDefault();

        // domain
        var domain = (function () {

          // domainの個数について、教科書には8と書いてあるのですが、
          // schedule.txtには10個のスケジュールがあり(∴0～9)、正しくは9だと思われます
          var domain = [], p = [0, 9];
          for (var i = 0, j = optimization.people.length * 2; i < j; i += 1) {
            domain.push(p);
          }
          return domain;
        }());

        // 解の表現[x, x, ..]を作って返す
        var makeExpression = function (answer) {
          return '[' + answer.join(', ') + ']';
        };

        // 表を作ってhtmlを返す関数
        var makeTable = function (answer) {
          var o = optimization.getschedule(answer);
          var $table = $('<table>'), $tr = $('<tr>'), $td = $('<td>');
          for (var i in o) {
            var $_tr = $tr.clone()
                        .append($td.clone().html(i))
                        .append($td.clone().html(o[i]["origin"]))
                        .append($td.clone().html(o[i]["out"]["time"]["dep"]))
                        .append($td.clone().html("-"))
                        .append($td.clone().html(o[i]["out"]["time"]["arr"]))
                        .append($td.clone().html("$" + o[i]["out"]["price"]))
                        .append($td.clone().html(o[i]["ret"]["time"]["dep"]))
                        .append($td.clone().html("-"))
                        .append($td.clone().html(o[i]["ret"]["time"]["arr"]))
                        .append($td.clone().html("$" + o[i]["ret"]["price"]))
                        .appendTo($table);
          }
          return $table.html();
        };

        // 番号によって分岐させる
        switch ($(this).attr('name')) {

          // 5.2, 5.3
          case "c20_submit":
            var c20_answer = [];

            // inputのvalueから解をつくる
            $('[name*="c20_input"]').each(function () {
              c20_answer.push($(this).val());
            });

            // 解を表示
            $('[name="c20_result_answer"]').html(makeExpression(c20_answer));
            $('[name="c20_result"]').html(makeTable(c20_answer));

            // 5.3
            var c30_result = optimization.schedulecost(c20_answer);
            $('[name="c30_result"]').html(c30_result);
            break;

          // 5.4
          case "c40_submit":
            var c40_answer = optimization.randomoptimize(domain, optimization.schedulecost);
            $('[name="c40_result_answer"]').html(makeExpression(c40_answer));
            $('[name="c40_result_table"]').html(makeTable(c40_answer));
            $('[name="c40_result_cost"]').html(optimization.schedulecost(c40_answer));
            break;

          // 5.5
          case "c50_submit":
            var c50_answer = optimization.hillclimb(domain, optimization.schedulecost);
            $('[name="c50_result_answer"]').html(makeExpression(c50_answer));
            $('[name="c50_result_table"]').html(makeTable(c50_answer));
            $('[name="c50_result_cost"]').html(optimization.schedulecost(c50_answer));
            break;

          // 5.6
          case "c60_submit":
            var c60_answer = optimization.annealingoptimize(domain, optimization.schedulecost,
                $('[name="c60_T"]').val(), $('[name="c60_cool"]').val(), $('[name="c60_step"]').val());
            $('[name="c60_result_answer"]').html(makeExpression(c60_answer));
            $('[name="c60_result_table"]').html(makeTable(c60_answer));
            $('[name="c60_result_cost"]').html(optimization.schedulecost(c60_answer));
            break;

          // 5.7
          case "c70_submit":
            var c70_answer = optimization.geneticoptimize(domain, optimization.schedulecost,
                $('[name="c70_popsize"]').val(), $('[name="c70_step"]').val(),
                $('[name="c70_mutprob"]').val(), $('[name="c70_elite"]').val(),
                $('[name="c70_maxiter"]').val());
            $('[name="c70_result_answer"]').html(makeExpression(c70_answer));
            $('[name="c70_result_table"]').html(makeTable(c70_answer));
            $('[name="c70_result_cost"]').html(optimization.schedulecost(c70_answer));
            break;
        }

      });
    }());

  });
});
