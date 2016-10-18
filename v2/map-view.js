'use strict';

var MapView = function($el, config){
    var _this = this;
    var _config = _.merge({
        init : {
            display: true,
            center: {
                lat: 36.37512908430549,
                lon: 127.60872401345618
            },
            level: 11
        },
        fit : function(){
            console.log('MapView.config.event.fit is empty function.');
        },
        event: {
            afterShow: function(){
                console.log('MapView.config.event.afterShow is empty function.');
            }
        }
    }, config);

    var _markers = [];
    var _infoWindows = [];
    var _selectedInfoWindow;

    var _mapId = $el.attr('id') + '-map';
    var _map;
    var _clusterer;
    var _currentPosition;

    /**
     * show control
     * @param isDisplay boolean default value true.
     */
    var baseDisplay = function(isDisplay) {
        if (isDisplay) {
            $el.show();

            if (_.isFunction(_config.event.fit)) {
                var dimension = _config.event.fit.call(_this);
                if (dimension.width  > 0) $el.find('#' + _mapId).width(dimension.width);
                if (dimension.height > 0) $el.find('#' + _mapId).height(dimension.height);
            }

            _map.relayout();
            if (_.isFunction(_config.event.afterShow)) {
                _config.event.afterShow.call(_this);
            }
        } else {
            $el.hide();
        }
    }

    var baseMapAdjust = function(config){
        if (config.center) _map.setCenter(new daum.maps.LatLng(config.lat, config.lon));
        if (config.level)  _map.setLevel(config.level);
    }

    /**
     * rendering data
     */
    var baseRender = function(data) {
        _map.setLevel(_config.init.level);
        _map.setCenter(new daum.maps.LatLng(data.centerLat, data.centerLon)); //중심변경
        _map.setDraggable(true);

        _clusterer.clear();
        if (!_.isEmpty(_infoWindows)) {
            _.each(_infoWindows, function(infoWindow){
                infoWindow.close();
            });
        }
        if (!_.isEmpty(_markers)) {
            _.each(_markers, function(marker){
                marker.setMap(null);
            });
            _markers = [];
        }

        //메뉴 마커 붙이기
        _.each(data.list, function(deal){
            var images = {
                'HOTEL': 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/hotel-v1.png',
                'DEAL' : 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/leisure-v1.png',
                'SEL'  : 'https://s3.ap-northeast-2.amazonaws.com/production-gajago-static/images/map-pins/gajago-pin.png'
            };
            var dealPosition = new daum.maps.LatLng(deal.lat, deal.lon);
            var marker = new daum.maps.Marker({
                'position': dealPosition,
                'title'   : deal.dealNm,
                'image'   : new daum.maps.MarkerImage(images[deal.dealType], new daum.maps.Size(40, 42))
            });
            marker.setMap(_map);
            marker.data = deal;
            _markers.push(marker);

            daum.maps.event.addListener(marker, 'click', function() {
                if (_selectedInfoWindow instanceof jQuery) _selectedInfoWindow.remove();

                var selectedMarkerImage = new daum.maps.MarkerImage(images['SEL'], new daum.maps.Size(40, 42));
                marker.setImage(selectedMarkerImage);

                var item = marker.data;
                var imageSrc = null;
                try {
                    imageSrc = item.listImageJson.list[0].image.src
                } catch(ex) {
                    console.log('Malformed listImageJson.', item);
                }

                if (imageSrc === null) return;

                var html = [];
                html.push('<div class="map-info-window">');
                html.push('<div class="thumb" style="background-image: url(', imageSrc, ');"></div>');
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
            });
        });

        _clusterer.addMarkers(_markers);

        baseDisplay(true);
    }

    /**
     * geolocation API는 비동기로 작동합니다.
     * 원하는 액션은 callback 함수를 사용하세요.
     */
    var baseGetCurrentPosition = function(callback) {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(function (position) {
                (function(position){
                    _currentPosition = position;
                    if (_.isFunction(callback)) {
                        callback.call(_this, _currentPosition);
                    }
                })(position);
            }, function (err) {
                alert('사용자 위치를 사용할 수 없습니다. 위치사용을 허용해주시면 보다 나은 서비스를 이용하실 수 있습니다.');
            });
        }

        return _currentPosition;
    }

    var actions = {
        'zoom-in': function(){
            _map.setLevel(_map.getLevel() - 1);
        },
        'zoom-out': function(){
            _map.setLevel(_map.getLevel() + 1);
        },
        'map-to-roadmap': function(){
            _map.setMapTypeId(daum.maps.MapTypeId.ROADMAP);
            $(this)
                .addClass('selected-btn')
                .removeClass('map-btn')
                .siblings()
                .addClass('map-btn')
                .removeClass('selected-btn');
        },
        'map-to-skyview': function(){
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
    var init = function(){
        var html = [
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
            level : _config.init.level
        });

        _clusterer = new daum.maps.MarkerClusterer({
            map: _map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
            averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
            minLevel: 10 // 클러스터 할 최소 지도 레벨
        });

        $el.on('click', '[data-action]', function(e){
            var action = $(this).data('action');
            if (!action in actions) return;

            actions[action].call(this);
        });

        baseDisplay(_config.init.display);
    }

    init();

    return {
        'display': baseDisplay,
        'render': baseRender,
        'getCurrentPosition': baseGetCurrentPosition,
        'mapAdjust': baseMapAdjust
    };
};
