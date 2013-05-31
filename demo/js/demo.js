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

      // 5章がsubmitされたときに計算
      $('#demo-form-chapter5').on('submit', function (e) {
        e.preventDefault();

        // 5.2
        var c20_result = optimization.getschedule(expression);
        $('[name="c20_result"]', this).html('');
        var $tr = $('<tr>'), $td = $('<td>');

        // 表をつくる
        for (var i in c20_result) {
          var $_tr = $tr.clone()
                      .append($td.clone().html(i))
                      .append($td.clone().html(c20_result[i]["origin"]))
                      .append($td.clone().html(c20_result[i]["out"]["time"]["dep"]))
                      .append($td.clone().html("-"))
                      .append($td.clone().html(c20_result[i]["out"]["time"]["arr"]))
                      .append($td.clone().html("$" + c20_result[i]["out"]["price"]))
                      .append($td.clone().html(c20_result[i]["ret"]["time"]["dep"]))
                      .append($td.clone().html("-"))
                      .append($td.clone().html(c20_result[i]["ret"]["time"]["arr"]))
                      .append($td.clone().html("$" + c20_result[i]["ret"]["price"]))
                      .appendTo('[name="c20_result"]', this);
        }

        // 5.3
        var c30_result = optimization.schedulecost(expression);
        $('[name="c30_result"]', this).first().html(c30_result);

      });

      // 解の表現をつくる
      var initExpression = (function () {
        var f = function (e) {

          // 一旦すべて削除
          expression.splice(0, expression.length);

          // 作成
          $('[name*="c00_input"]').each(function () {
            expression.push($(this).val());
          });
          $('[name="c00_expression"]').html('[' + expression.join(', ') + ']');
        };
        f();
        return f;
      }());
      $('[name*="c00_input"]').on('keyup change', initExpression);
    }());

  });
});
