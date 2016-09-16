'use strict';

/**
 * list view class
 * @param $el jQuery Element list view container
 * @param config Object config value
 */
var ListView = function($el, config){
    var _this = this;
    var _config = _.merge({
        init : {
            display: true
        },
        event: {
            afterShow: function(){
                console.log('ListView.config.event.show is empty function.');
            }
        }
    }, config);

    var $listBox = $('<div class="list-box"></div>');

    /**
     * show control
     * @param isDisplay boolean default value true.
     */
    var baseDisplay = function(isDisplay) {
        if (isDisplay) {
            $el.show();
            if (_.isFunction(_config.event.afterShow)) {
                _config.event.afterShow.call(_this);
            }
        } else {
            $el.hide();
        }
    };

    /**
     * rendering data
     */
    var baseRender = function(data) {
        var html = [
            '<div id="list-count">',
                '검색결과 <span class="text-count">', data.list.length, '</span>건',
            '</div>',
            '<ul>'
        ];
        _.each(data.list, function(item){
            var imageSrc = null;
            try {
                imageSrc = item.listImageJson.list[0].image.src
            } catch(ex) {
                console.log('Malformed listImageJson.', item);
            }

            if (imageSrc === null) return;

            html.push('<li>');
            html.push('<div class="thumb" style="background-image: url(', imageSrc, ');"></div>');
            html.push('<a class="deal-name" href="https://www.thegajago.com/deals/', item.id, '" target="_new">', item.dealNm, '</a>');
            if (item.dealPointDesc) {
                html.push('<p class="deal-desc ellipsis">', item.dealPointDesc, '</p>');
            }
            if (item.distanceKm) {
                html.push('<p class="deal-distance">', item.distanceKm.toFixed(2), 'Km</p>');
            }
            if (item.standardPrice) {
                html.push('<p class="deal-price">', (item.standardPrice).toLocaleString(), '원</p>');
            }
            html.push('</li>');
        });
        html.push('</ul>');

        $listBox.empty().append(html.join(''));
        baseDisplay(true);
    };

    function init(){
        $el.append($listBox);
        baseDisplay(_config.init.display);
    }

    init();

    return {
        'display': baseDisplay,
        'render': baseRender
    };
};
