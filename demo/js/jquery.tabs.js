(function ($) {

	$.fn.tabs = function(options) {

		// デフォルトの設定
		var settings = $.extend({

			// タブに関する設定
			tabElements: 'a',
			/* tabContainer: this, */
			tabLinkProperty: 'href',

			// セクションの設定
			sectionElements: 'section',
			sectionContainer: document,
			sectionAnchorProperty: 'id',

			// その他
			showingClass: 'active'

		}, options);  // 以上のデフォルト設定は引数で上書きされる

		var $tabContainer = $(this);
		var $sectionContainer = $(settings.sectionContainer);

		/**
		 * カスタムイベント: タブで指定したセクションを表示/非表示する
		 *
		 * 使い方:
		 *  $tabContainer.trigger('changeTabs', <targetSection>);
		 */
		$tabContainer.on('changeTabs', function(e, targetSection) {

			// ハッシュを変更する
			window.location.hash = targetSection;

			// アンカーとして使われるid #を削除
			if (targetSection[0] === '#' &&
					settings.sectionAnchorProperty !== 'id') {
				targetSection = targetSection.slice(1);
			}

			// 指定されたタブのclassを変更
			$tabContainer
				.find(settings.tabElements)
					.removeClass(settings.showingClass).end()
				.find([settings.tabElements,
							"[", settings.tabLinkProperty, "=", targetSection, "]"
							].join(''))
					.addClass(settings.showingClass);

			// アンカーとして使われるid #を削除
			if (targetSection[0] === '#') {
				targetSection = targetSection.slice(1);
			}

			// 指定されたセクションのclassを変更
			$sectionContainer
				.find(settings.sectionElements)
					.removeClass(settings.showingClass).end()
				.find([settings.sectionElements,
							"[", settings.sectionAnchorProperty, "=", targetSection, "]"
							].join(''))
					.addClass(settings.showingClass);
		});

		// タブがクリックされた時
		$tabContainer.on('click', settings.tabElements, function(e) {
			e.preventDefault();

			// クリックされたタブが指定するセクションを表示
			var targetSection = $(this).attr(settings.tabLinkProperty);
			$tabContainer.trigger("changeTabs", targetSection);
		});

		// ページをロードしたら最初のタブを表示
		if (window.location.hash) {
			$tabContainer.trigger("changeTabs", window.location.hash);
		} else {
			$tabContainer.trigger("changeTabs",
					$(settings.tabElements).first().attr(settings.tabLinkProperty)
			);
		}

		// 戻る/進むボタンを押した時に発動するイベント
		$(window).on('hashchange', function(e) {
			$tabContainer.trigger("changeTabs", window.location.hash);
		});

		// メソッドチェーンのためにreturn
		return $tabContainer;

	};

}(jQuery));
