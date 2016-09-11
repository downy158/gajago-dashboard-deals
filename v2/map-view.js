'use strict';

var MapView = function($el, config){
    var _config = _.merge({
        init : {
            display: true,
            center: {
                lat: 36.37512908430549,
                lon: 127.60872401345618
            },
            level: 12
        }
    }, config);

    var markers = [];
    var infoWindows = [];
    var selectedInfoWindow;

    var mapId = $el.attr('id') + '-map';
    var map;
    var clusterer;

    /**
     * show control
     * @param isDisplay boolean default value true.
     */
    var baseDisplay = function(isDisplay) {
        if (isDisplay) {
            $el.show();
        } else {
            $el.hide();
        }
    }

    /**
     * rendering data
     */
    var baseRender = function(data) {
        map.setLevel(_config.init.level);
        map.setCenter(new daum.maps.LatLng(data.centerLat, data.centerLon)); //중심변경
        map.setDraggable(true);

        clusterer.clear();

        //메뉴 마커 붙이기
        _.each(data.list, function(deal){
            var images = {
                    'HOTEL': '../images/marker-hotel.png',
                    'DEAL' : '../images/marker-leisure.png'
            };
            var dealPosition = new daum.maps.LatLng(deal.lat, deal.lon);
            var marker = new daum.maps.Marker({
                'position': dealPosition,
                'title'     : deal.dealNm,
                'image'     : new daum.maps.MarkerImage(images[deal.dealType], new daum.maps.Size(26, 38))
            });
            marker.setMap(map);
            markers.push(marker);

            var infoWindow = new daum.maps.InfoWindow({
                'position': dealPosition,
                'content' : ('<div class="ellipsis">' +
                    '<a href="https://www.thegajago.com/deals/' + deal.id + '" target="_blank">#' +
                    deal.id + ' ' +deal.dealNm + '</a></div>')
            });
            infoWindows.push(infoWindow);

            daum.maps.event.addListener(marker, 'click', function() {
                if (!_.isEmpty(selectedInfoWindow)) {
                    selectedInfoWindow.close();
                }

                infoWindow.open(map, marker);
                selectedInfoWindow = infoWindow;
            });
        });

        clusterer.addMarkers(markers);

        baseDisplay(true);
    }

    var actions = {
        'zoom-in': function(){
            map.setLevel(map.getLevel() - 1);
        },
        'zoom-out': function(){
            map.setLevel(map.getLevel() + 1);
        },
        'map-to-roadmap': function(){
            map.setMapTypeId(daum.maps.MapTypeId.ROADMAP);
            $(this)
                .addClass('selected-btn')
                .removeClass('map-btn')
                .siblings()
                .addClass('map-btn')
                .removeClass('selected-btn');
        },
        'map-to-skyview': function(){
            map.setMapTypeId(daum.maps.MapTypeId.HYBRID);
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
                '<div id="', mapId, '" style="height:400px;"></div>',
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

        map = new daum.maps.Map($('#' + mapId).get(0), {
            center: new daum.maps.LatLng(_config.init.center.lat, _config.init.center.lon),
            level : _config.init.level
        });

        clusterer = new daum.maps.MarkerClusterer({
            map: map, // 마커들을 클러스터로 관리하고 표시할 지도 객체
            averageCenter: true, // 클러스터에 포함된 마커들의 평균 위치를 클러스터 마커 위치로 설정
            minLevel: 12 // 클러스터 할 최소 지도 레벨
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
        'render': baseRender
    };
};
