require(["jquery", "../../lib/main"], function($) {
  $(function() {

    // �Ƃ肠�����A�t�H�[���ɓ��͂��ꂽ�f�[�^���������߂̗p��
    var makeOption = function ($form) {
      var source = JSON.parse( $('*[name="source"]', $form).first().val() ) || '';
      var $option = $('<option />');

      $('*[name^="item"]', $form).html('');

      for (var name in source) {
        $option.clone().val(name).text(name).appendTo($('*[name^="item"]', $form));
      }
    };

    makeOption($('form'));
    

    $( $('*[name="source"]').first() ).on('keyup change', function (e) {
      makeOption( $(this).closest('form') );
    });

    $('#demo-form-chapter2').on('submit', function (e) {
      e.preventDefault();

      var source = JSON.parse( $('*[name="source"]', this).first().val() );
      var method = $('*[name="method"]:checked', this).val();

      var item1 = $('*[name="item1"]', this).first().val();
      var item2 = $('*[name="item2"]', this).first().val();
      var item3 = $('*[name="item3"]', this).first().val();
      var item4 = $('*[name="item4"]', this).first().val();

      var recommendations = new Recommendations();
      
      var sscritics = JSON.stringify(recommendations.critics);
      var scritics = JSON.parse(sscritics);

      var result1 = recommendations[method](source, item1, item2);      
      var result2 = recommendations.topMatches(source, item3, item4, method);
      
      var result3 = recommendations[method](scritics, item1, item2);
      var result4 = recommendations.topMatches(scritics, item3, item4, method);

      $('*[name="result1"]', this).first().val(result1);
      $('*[name="result2"]', this).first().html(result2.join('<br>'));
      
      $('*[name="result3"]', this).first().val(result3);
      $('*[name="result4"]', this).first().html(result4.join('<br>'));
      
    });

  });
});