require(["jquery", "jquery.tabs", "ccchart", "../../lib/main"], function($) {
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

      // domain
      var domain = (function () {

        // domainの個数について、教科書には8と書いてあるのですが、
        // schedule.txtには10個のスケジュールがあり(∴0〜9)、正しくは9だと思われます
        var domain = [], p = [0, 9];
        for (var i = 0, j = optimization.people.length * 2; i < j; i += 1) {
          domain.push(p);
        }
        return domain;
      }());

      // 結果を出力するコンストラクタ
      var Demo = function (o) {
        this.answer = o.answer;
        this.$answer = o.$answer;
        this.$table = o.$table;
        this.$cost = o.$cost;
        this.optimization = o.optimization || optimization;
      };

      Demo.prototype.getExpression = function () {
        return '[' + this.answer.join(', ') + ']';
      };

      Demo.prototype.getTimeTable = function () {
        var o = this.optimization.getschedule(this.answer);
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

      Demo.prototype.getScheduleCost = function () {
        return this.optimization.schedulecost(this.answer);
      };

      Demo.prototype.export = function () {
        this.$answer.html(this.getExpression());
        this.$table.html(this.getTimeTable());
        this.$cost.html(this.getScheduleCost());
      };

      // チャート生成
      var drawChart, Chart = function () {
        var method = {
          "geneticoptimize": {
            "use": $("[type=checkbox][name*=geneticoptimize]").attr('checked'),
            "name": "遺伝アル",
            "colorSet": "rgba(200, 220, 250, 0.9)",
            "push": function () {
              var t = new Demo({answer: optimization.geneticoptimize(domain, optimization.schedulecost,
                $('[name="c70_popsize"]').val(), $('[name="c70_step"]').val(),
                $('[name="c70_mutprob"]').val(), $('[name="c70_elite"]').val(),
                $('[name="c70_maxiter"]').val())
              });
              return t.getScheduleCost();
            },
            "showAve": function (ave) {
              $("[name=ave_geneticoptimize]").val(ave);
            }
          },
          "annealingoptimize": {
            "use": $("[type=checkbox][name*=annealingoptimize]").attr('checked'),
            "name": "模擬アニ",
            "colorSet": "rgba(56, 127, 47, 0.9)",
            "push": function () {
              var t = new Demo({
                answer: optimization.annealingoptimize(domain, optimization.schedulecost,
                $('[name="c60_T"]').val(), $('[name="c60_cool"]').val(),
                $('[name="c60_step"]').val(), $('[name="c60_count"]').val())
              });
              return t.getScheduleCost();
            },
            "showAve": function (ave) {
              $("[name=ave_annealingoptimize]").val(ave);
            }
          },
          "hillclimb": {
            "use": $("[type=checkbox][name*=hillclimb]").attr('checked'),
            "name": "ヒルクラ",
            "colorSet": "rgba(125, 107, 147, 0.9)",
            "push": function () {
              var t = new Demo({answer: optimization.hillclimb(domain, optimization.schedulecost)});
              return t.getScheduleCost();
            },
            "showAve": function (ave) {
              $("[name=ave_hillclimb]").val(ave);
            }
          },
          "randomoptimize": {
            "use": $("[type=checkbox][name*=randomoptimize]").attr('checked'),
            "name": "ランダム",
            "colorSet": "rgba(208, 128, 50, 0.9)",
            "push": function () {
              var t = new Demo({answer: optimization.randomoptimize(domain, optimization.schedulecost)});
              return t.getScheduleCost();
            },
            "showAve": function (ave) {
              $("[name=ave_randomoptimize]").val(ave);
            }
          }
        };
        var i = 1, data = (function () {
          var data = [["試行回数"]];
          for (var i in method) {
            if (method[i].use) {
              data.push([method[i].name]);
            }
          }
          return data;
        }());
        for (var m in method) {
          if (method[m].use) {
            method[m].index = i;
            i += 1;
          }
        }
        var timer, f, j = 1;
        return function (i) {
          if (!f) {
            if (i - 0 === 0) {
              f = 0;
              draw();
              if (timer) clearInterval(timer);
            } else {
              f = 1;
              timer = setInterval(draw, i * 1000);
            }
          } else {
            f = 0;
            clearInterval(timer);
          }
          function draw() {
            data[0].push(j++);
            for (var m in method) {
              if (method[m].use) {

                // 100個を超えたら前から捨てていく
                if (data[method[m].index].length > 100) {
                  data[method[m].index].splice(1, 1);
                }
                data[method[m].index].push(method[m].push());

                for (var x = 1, y = data[method[m].index].length, z = 0; x < y; x += 1 ) {
                  z += data[method[m].index][x];
                }
                method[m].showAve(z / y);
              }
            }
            var chartData = {
              "config": {
                "lineWidth": 2,
                "bg": "white",
                "useMarker": "css-ring",
                "markerWidth": 6,
                "shadows": {"all": "none"},
                "useToolTip": "yes",
                "colorSet": (function () {
                  var r = [];
                  for (var i in method) {
                    if (method[i].use) {
                      r.push(method[i].colorSet);
                    }
                  }
                  return r;
                }()),
                "textColors": {"all": "#333"},
                "width": 636,
                "height": 400
              },
              "data": data
            };
            ccchart.init('chart', chartData);
          };
        };
      };

      // 5章のいずれかのボタンがclickされたときに計算
      $('#demo-form-chapter5').on('click', '[name*=chart_use_]', function (e) {
        drawChart(0);
        drawChart = Chart();
        $('[name=*"ave_"]').val('');
      }).on('click', '[type=submit]', function (e) {
        e.preventDefault();

        // 番号によって分岐させる
        switch ($(this).attr('name')) {

          // チャート生成
          case "chart_draw":
            if (!drawChart) drawChart = Chart();
            drawChart($(this).prev().val());
            break;

          // 5.2, 5.3
          case "c20_submit":
            var c20 = new Demo({
              answer: (function () {
                var r = [];
                $('[name*="c20_input"]').each(function () {
                  r.push($(this).val());
                });
                return r;
              }()),
              $answer: $('[name="c20_result_answer"]'),
              $table: $('[name="c20_result"]'),
              $cost: $('[name="c30_result"]')
            });
            c20.export();
            break;

          // 5.4
          case "c40_submit":
            var c40 = new Demo({
              answer: optimization.randomoptimize(domain, optimization.schedulecost),
              $answer: $('[name="c40_result_answer"]'),
              $table: $('[name="c40_result_table"]'),
              $cost: $('[name="c40_result_cost"]')
            });
            c40.export();
            break;

          // 5.5
          case "c50_submit":
            var c50 = new Demo({
              answer: optimization.hillclimb(domain, optimization.schedulecost),
              $answer: $('[name="c50_result_answer"]'),
              $table: $('[name="c50_result_table"]'),
              $cost: $('[name="c50_result_cost"]')
            });
            c50.export();
            break;

          // 5.6
          case "c60_submit":
            var c60 = new Demo({
              answer: optimization.annealingoptimize(domain, optimization.schedulecost,
                $('[name="c60_T"]').val(), $('[name="c60_cool"]').val(), $('[name="c60_step"]').val()),
              $answer: $('[name="c60_result_answer"]'),
              $table: $('[name="c60_result_table"]'),
              $cost: $('[name="c60_result_cost"]')
            });
            c60.export();
            break;

          // 5.7
          case "c70_submit":
            var c70 = new Demo({
              answer: optimization.geneticoptimize(domain, optimization.schedulecost,
                $('[name="c70_popsize"]').val(), $('[name="c70_step"]').val(),
                $('[name="c70_mutprob"]').val(), $('[name="c70_elite"]').val(),
                $('[name="c70_maxiter"]').val()),
              $answer: $('[name="c70_result_answer"]'),
              $table: $('[name="c70_result_table"]'),
              $cost: $('[name="c70_result_cost"]')
            });
            c70.export();
            break;

          case "c100_submit":
            var socialnetwork = new Socialnetwork();
            var sol;
            $(this).siblings().find('input').each(function () {
              if ($(this).attr('checked')) {
                sol = optimization[$(this).val()](socialnetwork.domain, socialnetwork.crosscount.bind(socialnetwork));
              }
            });
            $('[name="c100_result_cost"]').html(socialnetwork.crosscount.call(socialnetwork, sol));
            socialnetwork.drawnetwork(sol, 'network');
            break;
        }
      });
    }());

    // 11章
    var chapter11 = (function () {

      // p.277
      var gp = new Gp();
      var exampletree = new gp.exampletree();

      // p.277
      console.log( exampletree.evaluate([2, 3]) );
      console.log( exampletree.evaluate([5, 3]) );

      // p.278
      exampletree.display();

      // p.279
      var random1 = new gp.makerandomtree(2);
      console.log( random1.evaluate([7, 1]) );
      console.log( random1.evaluate([2, 4]) );

      var random2 = new gp.makerandomtree(2);
      console.log( random1.evaluate([5, 3]) );
      console.log( random1.evaluate([5, 20]) );

      // p.281,2
      // var hiddenset = gp.buildhiddenset();
      // console.log( gp.scorefunction(random1, hiddenset) );
      // console.log( gp.scorefunction(random2, hiddenset) );

      // p.284
      // random2.display();
      // var muttree = new gp.mutate(random2, 2);
      // muttree.display();

      // p.285
      // console.log( gp.scorefunction(random2, hiddenset) );
      // console.log( gp.scorefunction(muttree, hiddenset) );

      // p.286
      // var random1 = new gp.makerandomtree(2);
      // random1.display();
      // var random2 = new gp.makerandomtree(2);
      // random2.display();
      // var cross = new gp.crossover(random1, random2, '', 0);
      // cross.display();


    }());

  });
});
