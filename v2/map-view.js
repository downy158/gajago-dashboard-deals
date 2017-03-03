'use strict';

let MapView = ($el, config) => {
    let _this = this;
    let _config = _.merge({
        init: {
            display: true,
            center: {
                lat: 36.37512908430549,
                lon: 127.60872401345618
            },
            level: 11
        },
        fit: () => {
            console.log('MapView.config.event.fit is empty function.');
        },
        event: {
            afterShow: () => {
                console.log('MapView.config.event.afterShow is empty function.');
            }
        }
    }, config);

    //parameta token 취득


    let _markers = [];
    let _infoWindows = [];
    let _selectedInfoWindow;

    let _mapId = $el.attr('id') + '-map';
    let _map;
    let _clusterer;
    let _currentPosition;

    /**
     * show control
     * @param isDisplay boolean default value true.
     */
    let baseDisplay = (isDisplay) => {
        if (isDisplay) {
            $el.show();

            if (_.isFunction(_config.event.fit)) {
                let dimension = _config.event.fit.call(_this);
                if (dimension.width > 0) $el.find('#' + _mapId).width(dimension.width);
                if (dimension.height > 0) $el.find('#' + _mapId).height(dimension.height);
            }

            _map.relayout();
            if (_.isFunction(_config.event.afterShow)) {
                _config.event.afterShow.call(_this);
            }
        } else {
            $el.hide();
        }
    };

    let baseMapAdjust = (config) => {
        if (config.center) _map.setCenter(new daum.maps.LatLng(config.lat, config.lon));
        if (config.level) _map.setLevel(config.level);
    };

    /**
     * rendering data
     */
    let baseRender = (data) => {
        _map.setLevel(_config.init.level);
        _map.setCenter(new daum.maps.LatLng(data.centerLat, data.centerLon)); //중심변경
        _map.setDraggable(true);

        _clusterer.clear();
        if (!_.isEmpty(_infoWindows)) {
            _.each(_infoWindows, function (infoWindow) {
                infoWindow.close();
            });
        }
        if (!_.isEmpty(_markers)) {
            _.each(_markers, function (marker) {
                marker.setMap(null);
            });
            _markers = [];
        }

        //메뉴 마커 붙이기
        _.each(data.list, function (deal) {
            let images = {
                'HOTEL': 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/hotel-v1.png',
                'DEAL': 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/leisure-v1.png',
                'SEL': 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/gajago-pin.png'
            };
            let dealPosition = new daum.maps.LatLng(deal.lat, deal.lon);
            let marker = new daum.maps.Marker({
                'position': dealPosition,
                'title': deal.dealNm,
                'image': new daum.maps.MarkerImage(images[deal.dealType], new daum.maps.Size(40, 42))
            });
            marker.setMap(_map);
            marker.data = deal;
            _markers.push(marker);


            daum.maps.event.addListener(marker, 'click', function () {
                if (_selectedInfoWindow instanceof jQuery) _selectedInfoWindow.remove();

                let selectedMarkerImage = new daum.maps.MarkerImage(images['SEL'], new daum.maps.Size(40, 42));
                marker.setImage(selectedMarkerImage);

                let item = marker.data;
                let imageSrc = null;
                try {
                    imageSrc = item.listImageJson.list[0].image.src
                } catch (ex) {
                    console.log('Malformed listImageJson.', item);
                }

                if (imageSrc === null) return;

                let html = [];
                html.push('<div class="map-info-window">');
                html.push('<div class="thumb" style="background-image: url(', imageSrc, ');">',
                    '<a href="https://www.thegajago.com/deals/', item.id, '" target="_new" style="display:block;height:100%;"></a></div>');
                html.push('<p class="ellipsis"><a class="deal-name" href="https://www.thegajago.com/deals/', item.id, '" target="_new">', item.dealNm, '</a></p>');
                if (item.dealPointDesc) {
                    html.push('<p class="deal-desc ellipsis">', item.dealPointDesc, '</p>');
                }
                if (item.distanceKm) {
                    html.push('<p class="deal-distance">', item.distanceKm.toFixed(2), 'Km</p>');
                }
                if (item.standardPrice) {
                    html.push('<p class="deal-price">', (item.standardPrice).toLocaleString(), '원</p>');
                }
                html.push('</div>');

                _selectedInfoWindow = $(html.join(''));
                $el.append(_selectedInfoWindow);

                _config.event.markerClick.call(marker);

                if (item.isChecked) return;

                //보물찾기
                eventChk();
                item.isChecked = true;
            });
        });

        _clusterer.addMarkers(_markers);

        baseDisplay(true);
    }
    /**
     * event 보물찾기 2016-10-18
     */
    const _root = this;
    _root.tips = [
        "내 위치 설정을 ON하면 보물찾기가 쉬워져!",
        "SNS에 보물찾기 이벤트를 공유하면 확률이 UP!",
        "심호흡을 한번하고 평정심을 유지하면 확률이 UP!",
        "상품을 구매하면 확률이 UP!"
    ];
    let modal = new ax5.ui.modal();
    let mask = new ax5.ui.mask();
    let eventChk = () => {
        let html = '<div class="event-view">';
        $.get('http://220.70.71.58:10391/events/hunt' + location.search, function (data) {
            // console.log("data",data)
            // data = {
            //     'winning' : true,
            //     'maileage': 5000,
            //     'coffee'  : false
            // }
            if (data.winning) { // 마일리지 당첨
                html += '<img alt="마일리지 ' + data.maileage + '" src="https://s3.ap-northeast-2.amazonaws.com/gajado/images/event-result-m-' + data.maileage + '.gif">'
                html += '<a href="https://www.thegajago.com/mileage" target="_blank" class="btn btn-link">적립금보기</a>'
            } else if (!data.winning && data.message) {//  이벤트 종료(소진) & 최대 당첨횟수 제약
                html += '<p>' + data.message + '</p>'
                html += '<a href="https://www.thegajago.com/mileage" target="_blank" class="btn btn-link">적립금보기</a>'
            } else if (data.coffee) {// 커피당첨
                html += '<img alt="커피당첨" src="https://s3.ap-northeast-2.amazonaws.com/gajado/images/event-result-c.gif">'
                html += '<a href="https://www.thegajago.com/notices/158" target="_blank" class="btn btn-link">사용방법보기</a>'
            } else if (data.hotel) {// 숙박당첨
                html += '<img alt="숙박당첨" src="https://s3.ap-northeast-2.amazonaws.com/gajado/images/event-result-i.gif">'
                html += '<a href="https://www.thegajago.com/notices/158" target="_blank" class="btn btn-link">사용방법보기</a>'
            } else {// 꽝
                html += '<img alt="꽝" src="https://s3.ap-northeast-2.amazonaws.com/gajado/images/event-result-0.gif">'
                html += '<button type="button" class="btn btn-link btn-tip">힌트보러가기</button>'
            }
            html += '</div>';
            mask.open();
            modal.open({
                width: 320,
                height: 400,
                onStateChanged: function () {
                    // console.log(this);
                    if (this.state == "close") {
                        mask.close();
                    }
                    ;
                }
            }, function () {
                var _this = this;
                console.log(_this + 'gg');
                var templ = '' +
                    '<div class="event">' +
                    '<button type="button" class="btn btn-close"><img alt="close" src="../images/close-dark.png"></button>' +
                    '<div class="event-contents">' + html + '</div>' +
                    '</div>';
                this.$.body.append(templ);

                //창닫기
                $('.btn-close').click(function () {
                    modal.close();
                    mask.close();
                });


                //힌트보기
                $('.btn-tip').click(function () {
                    var tipNum = _.random(_root.tips.length - 1);
                    var templ = '' +
                        '<div class="event event-dark">' +
                        '<button type="button" class="btn btn-close"><img alt="close" src="../images/close-light.png"></button>' +
                        '<div class="event-tip"><img alt="" src="../images/ico-treasure.png">' + _root.tips[tipNum] + '</div>' +
                        '<div class="event-links">' +
                        '<a href="https://www.thegajago.com/mileage" target="_blank" class="btn btn-tip btn-event-mileage">적립금 보러가기</a>' +
                        '<a href="https://www.thegajago.com/categories/112" target="_blank" class="btn btn-tip btn-event-gajado">첫 페이지로</a>' +
                        '<a href="https://www.thegajago.com/" target="_blank" class="btn btn-tip btn-event-return">그만하기</a>' +
                        '</div>' +
                        '</div>'
                    _this.$.body.empty().append(templ);

                    //창닫기
                    $('.btn-close').click(function () {
                        modal.close();
                        mask.close();
                    });
                })
            });
        });
    };
    /**
     * geolocation API는 비동기로 작동합니다.
     * 원하는 액션은 callback 함수를 사용하세요.
     */
    let baseGetCurrentPosition = (callback) => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                (function (position) {
                    _currentPosition = position;
                    if (_.isFunction(callback)) {
                        callback.call(_this, _currentPosition);
                    }
                })(position);
            }, function (err) {
                alert('사용자 위치를 사용할 수 없습니다.\n위치사용을 허용해주시면 보다 나은 서비스를 이용하실 수 있습니다.\n-- 서울을 기본으로 검색합니다. --');
                if (_.isFunction(callback)) {
                    let defaultPosition = {
                        coords: {
                            latitude: 37.56681519476317,
                            longitude: 126.97866358044901
                        }
                    };
                    callback.call(_this, defaultPosition);
                }
            });
        }

        return _currentPosition;
    };

    let actions = {
        'zoom-in': () => {
            _map.setLevel(_map.getLevel() - 1);
        },
        'zoom-out': () => {
            _map.setLevel(_map.getLevel() + 1);
        },
        'map-to-roadmap': function () {
            _map.setMapTypeId(daum.maps.MapTypeId.ROADMAP);
            $(this)
                .addClass('selected-btn')
                .removeClass('map-btn')
                .siblings()
                .addClass('map-btn')
                .removeClass('selected-btn');
        },
        'map-to-skyview': function () {
            _map.setMapTypeId(daum.maps.MapTypeId.HYBRID);
            $(this)
                .addClass('selected-btn')
                .removeClass('map-btn')
                .siblings()
                .addClass('map-btn')
                .removeClass('selected-btn');
        }
    };

    // init
    let init = () => {
        let html = [
            '<div class="map_wrap">',
            '<div id="', _mapId, '" style="height:400px;"></div>',
            '<div class="custom_typecontrol radius_border">',
            '<span data-action="map-to-roadmap" class="selected-btn">지도</span>',
            '<span data-action="map-to-skyview" class="map-btn">스카이뷰</span>',
            '</div>',
            '<div class="custom_zoomcontrol radius_border">',
            '<span data-action="zoom-in" ><img src="https://i1.daumcdn.net/localimg/localimages/07/mapapidoc/ico_plus.png"  alt="확대"></span>',
            '<span data-action="zoom-out"><img src="https://i1.daumcdn.net/localimg/localimages/07/mapapidoc/ico_minus.png" alt="축소"></span>',
            '</div>',
            '</div>'
        ];
        $el.append(html.join(''));

        _map = new daum.maps.Map($('#' + _mapId).get(0), {
            center: new daum.maps.LatLng(_config.init.center.lat, _config.init.center.lon),
            level: _config.init.level
        });

        _clusterer = new daum.maps.MarkerClusterer({
            map: _map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
            averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
            minLevel: 10 // 클러스터 할 최소 지도 레벨
        });

        $el.on('click', '[data-action]', function (e) {
            let action = $(this).data('action');
            if (!action in actions) return;

            actions[action].call(this);
        });

        baseDisplay(_config.init.display);
    };

    init();

    return {
        'display': baseDisplay,
        'render': baseRender,
        'getCurrentPosition': baseGetCurrentPosition,
        'mapAdjust': baseMapAdjust
    };
};
