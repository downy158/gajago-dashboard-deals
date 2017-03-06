'use strict';

/**
 * filter view class
 * @param $el jQuery Element list view container
 * @param config Object config value
 */
const FilterView = function($el, config){
    const _config = _.merge({
        init : {
            display: true
        },
        event: {
            select: () => {
                console.log('FilterView.config.event.select is empty function.');
            }
        }
    }, config);

    let _this  = this;
    let $menu1 = $('<li class="depth1menu"></li>');
    let $menu2 = $('<li class="depth2menu"></li>');
    const _menus = [
        {
            "fullCode": "01",
            "name": "서울",
            "children": [
                {
                    "fullCode": "01",
                    "name": "전체"
                },
                {
                    "fullCode": "0102",
                    "name": "강동/강남"
                },
                {
                    "fullCode": "0103",
                    "name": "강서/강북"
                }
            ]
        },
        {
            "fullCode": "02",
            "name": "경기/인천",
            "children": [
                {
                    "fullCode": "02",
                    "name": "전체"
                },
                {
                    "fullCode": "0202",
                    "name": "일산/파주/헤이리"
                },
                {
                    "fullCode": "0203",
                    "name": "가평/양평"
                },
                {
                    "fullCode": "0204",
                    "name": "구리/남양주/포천"
                },
                {
                    "fullCode": "0205",
                    "name": "용인/이천/판교"
                },
                {
                    "fullCode": "0206",
                    "name": "수원/평택"
                },
                {
                    "fullCode": "0207",
                    "name": "인천/부천/강화"
                }
            ]
        },
        {
            "fullCode": "03",
            "name": "강원",
            "children": [
                {
                    "fullCode": "03",
                    "name": "전체"
                },
                {
                    "fullCode": "0302",
                    "name": "평창"
                },
                {
                    "fullCode": "0303",
                    "name": "춘천/홍천"
                },
                {
                    "fullCode": "0304",
                    "name": "정선/영월"
                },
                {
                    "fullCode": "0305",
                    "name": "속초/강릉"
                }
            ]
        },
        {
            "fullCode": "04",
            "name": "충청",
            "children": [
                {
                    "fullCode": "04",
                    "name": "전체"
                },
                {
                    "fullCode": "0402",
                    "name": "태안/대천"
                },
                {
                    "fullCode": "0403",
                    "name": "단양/제천"
                },
                {
                    "fullCode": "0404",
                    "name": "대전"
                }
            ]
        },
        {
            "fullCode": "05",
            "name": "경상",
            "children": [
                {
                    "fullCode": "05",
                    "name": "전체"
                },
                {
                    "fullCode": "0502",
                    "name": "부산"
                },
                {
                    "fullCode": "0503",
                    "name": "경주"
                },
                {
                    "fullCode": "0504",
                    "name": "대구"
                },
                {
                    "fullCode": "0505",
                    "name": "남해"
                },
                {
                    "fullCode": "0506",
                    "name": "거제/통영"
                }
            ]
        },
        {
            "fullCode": "06",
            "name": "전라",
            "children": [
                {
                    "fullCode": "06",
                    "name": "전체"
                },
                {
                    "fullCode": "0602",
                    "name": "여수"
                },
                {
                    "fullCode": "0603",
                    "name": "전주"
                },
                {
                    "fullCode": "0604",
                    "name": "무주"
                },
                {
                    "fullCode": "0605",
                    "name": "광주/화순/함평"
                },
                {
                    "fullCode": "0606",
                    "name": "담양/순천/보성"
                }
            ]
        },
        {
            "fullCode": "07",
            "name": "제주",
            "children": [
                {
                    "fullCode": "07",
                    "name": "전체"
                },
                {
                    "fullCode": "0702",
                    "name": "제주시"
                },
                {
                    "fullCode": "0703",
                    "name": "서귀포시"
                }
            ]
        }
    ];

    function appendMenu1(){
        let html = ['<ul>'];
        _.each(_menus, function(menu1){
            html.push('<li><a class="depth1menu-cell" data-href="'+ menu1.fullCode+'">'+ menu1.name +'</a></li>');
        });
        html.push('</ul>');
        $menu1.append(html);
    }

    function appendMenu2(parentFullCode){
        let html = ['<ul>'];
        let menu1 = _.find(_menus, { fullCode: parentFullCode });
        _.each(menu1.children, function(menu2){
            html.push('<li><a class="depth2menu-cell" data-href="'+ menu2.fullCode+'">'+ menu2.name +'</a></li>');
        });
        html.push('</ul>');

        $menu2.empty().append(html.join(''));
    }

    /**
     * show control
     * @param isDisplay boolean default value true.
     */
    let baseDisplay = (isDisplay) => {
        if (isDisplay) {
            $el.show();
        } else {
            $el.hide();
        }
    };

    // init
    function init(){
        let html = [
            '<div class="filter-box-msg">원하시는 지역을 선택하세요</div>',
            '<ul class="menu"></ul>'
        ];
        $el.append(html.join(''));
        $el.find('.menu')
            .append($menu1)
            .append($menu2);

        appendMenu1();

        $el.on('click', '.depth1menu a', function(e){
            $el.find('.depth1menu li').removeClass('active');
            $(this).parent().addClass('active');

            var code = $(this).attr('data-href');
            appendMenu2(code);

            e.preventDefault();
        });

        $el.on('click', '.depth2menu a', function(e){
            if (_.isFunction(_config.event.select)) {
                _config.event.select.call(_this, e);
            }

            e.preventDefault();
        });

        baseDisplay(_config.init.display);
    }

    init();

    return {
        'display': baseDisplay
    };
};
