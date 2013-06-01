require(["jquery", "jquery.tabs", "../../lib/main"], function($) {
  $(function() {

    // �^�u
    $("nav").tabs();

    // 2��
    var chapter2 = (function () {

      // Recommendations
      var recommendations = new Recommendations();

      // 2�͂�submit���ꂽ�Ƃ��Ɍv�Z����
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

      // textarea�ɓ��͂��ꂽjson����I�v�V���������
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

      // textarea���ύX���ꂽ�Ƃ��A�I�v�V��������蒼��
      $( $('[name="source"]').first() ).on('keyup change', function (e) {
        initOption( $(this).closest('form') );
      });
    }());


    // 5��
    var chapter5 = (function () {

      // Optimization
      var optimization = new Optimization();

      // ���̕\�����쐬
      var expression = [];

      // 5�͂̂����ꂩ�̃{�^����click���ꂽ�Ƃ��Ɍv�Z
      $('#demo-form-chapter5').on('click', '[name*=submit]', function (e) {
        e.preventDefault();

        // domain
        var domain = (function () {

          // domain�̌��ɂ��āA���ȏ��ɂ�8�Ə����Ă���̂ł����A
          // schedule.txt�ɂ�10�̃X�P�W���[��������(��0�`9)�A��������9���Ǝv���܂�
          var domain = [], p = [0, 9];
          for (var i = 0, j = optimization.people.length * 2; i < j; i += 1) {
            domain.push(p);
          }
          return domain;
        }());

        // ���̕\��[x, x, ..]������ĕԂ�
        var makeExpression = function (answer) {
          return '[' + answer.join(', ') + ']';
        };

        // �\�������html��Ԃ��֐�
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

        // �ԍ��ɂ���ĕ��򂳂���
        switch ($(this).attr('name')) {

          // 5.2, 5.3
          case "c20_submit":
            var c20_answer = [];

            // input��value�����������
            $('[name*="c20_input"]').each(function () {
              c20_answer.push($(this).val());
            });

            // ����\��
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
