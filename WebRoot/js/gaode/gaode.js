/*
由于Chrome、IOS10等已不再支持非安全域的浏览器定位请求，为保证定位成功率和精度，请尽快升级您的站点到HTTPS。
*/
var map,
    geolocation,
    overView,
    auto,
    placeSearch,
    attrInfoWindow,
    googleLayer = null,
    marker,
    cluster, markers = [],
	accLngLat=[];

$(function(){
	showMap();
	//getImage();
	getInfoBasicData();
});

function getInfoBasicData(){
	var url="http://localhost:8080/TrafficAccident/getInfoBasic";
	_ajaxPost(url,null,success,error);
}
function success(data)
{
	gisInfoBasicData(data);
}

function error(data)
{
	alert("数据获取失败");
}
function gisInfoBasicData(data){
	require(["js/coordTransform.js"],function(coordtransform){
		var lastFlashNum = 0;//显示N条距离当前时间最近发生的事故
		 //其他发生的事故
		  for(var i=lastFlashNum;i<data.length;i++){
			  var accLng=parseFloat(data[i].AccLon);
			  var accLat=parseFloat(data[i].AccLat);
			  accLngLat=coordtransform.wgs84togcj02(accLng,accLat);
			  addMarker(i,data);
		  }
		  
	});
	//addCluster();//// 添加点聚合
}
//添加marker标记
function addMarker(i,data) {
//  map.clearMap();
		var marker = new AMap.Marker({
			//icon:"img/icon/position-black.ico",
			icon:"img/marker.png",
			position: accLngLat,
			map: map,
			offset: {x: -8,y: -34}
		});
		markers.push(marker);
		marker.content='<div class="info">'+
							'<div class="infoTop">'+
								'<div class="title">属性信息</div>'+
								'<img src="img/close2.gif" onclick="closeInfoWindow();" />'+
							'</div>'+
							'<div class="infoMiddle">'+
								'<div>事故编号：'+data[i].AccCode+'</div>'+
								'<div>经度：'+parseFloat(data[i].AccLon)+'</div>'+
								'<div>纬度：'+parseFloat(data[i].AccLat)+'</div>'+
								'<div>事故发生时间：'+data[i].HappenTime+'</div>'+
								'<div>受伤人数：'+parseInt(data[i].PersonHarm)+'</div>'+
								'<div>死亡人数：'+parseInt(data[i].PersonDeath)+'</div>'+
								'<div>事故地点：'+data[i].AccPlaces+'</div>'+
							'</div>'+
						'</div>';
		//鼠标点击marker弹出自定义的信息窗体
		AMap.event.addListener(marker, 'click', function(e) {
			attrInfoWindow.open(map, marker.getPosition());
			//attrInfoWindow.setContent("坐标："+e.lnglat.getLng() + ", " + e.lnglat.getLat())
			attrInfoWindow.setContent(e.target.content);
		});
}
$("#markerClusterer").click(function(){
	if($(this).hasClass("active")){
		cluster.removeMarkers(markers);
		$(this).removeClass("active");
	}else{
	    addCluster();
		$(this).addClass("active");
	}
	
});
// 添加点聚合
function addCluster() {
    if (cluster) {
        cluster.setMap(null);
    }
    
    map.plugin(["AMap.MarkerClusterer"], function() {
        cluster = new AMap.MarkerClusterer(map, markers);
      
       
    });
  };

//初始化显示地图
function showMap(){
	map=new AMap.Map('container',{
		resizeEnable:true,
		keyboardEnable:true
		
	});
	//使得地图显示在合适的范围之内
	map.setFitView();
	//为地图注册click事件获取鼠标点击出的经纬度坐标
	var clickEventListener = map.on('click', function(e) {
	    document.getElementById("lnglat").innerHTML = "经度："+e.lnglat.getLng() + "<br>"+
	    											"纬度：" + e.lnglat.getLat();
	});
	attrInfoWindow=new AMap.InfoWindow({
		isCustom: true,  //使用自定义窗体
		offset: new AMap.Pixel(0, -30)
	
	});
	map.plugin(['AMap.ToolBar','AMap.Scale','AMap.Geolocation','AMap.OverView','AMap.Autocomplete'],function(){
		geolocation=new AMap.Geolocation({
			/*markerOptions:new AMap.Marker({
	        	icon:"img/loc_gray.png",
	            map: map
	    }),
	    circleOptions:new AMap.Circle({
	    	
	    }),*/
			enableHighAccuracy:true,     //是否使用高精度定位，默认:true
			timeout: 10000,              //超过10秒后停止定位，默认：无穷大
			maximumAge: 0,           //定位结果缓存0毫秒，默认：0
	        convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
			buttonOffset: new AMap.Pixel(20, 280),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
	        zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
	        buttonPosition:'LT'         //定位按钮停靠位置，默认：'LB'，左下角
		});
		overView = new AMap.OverView({
	        visible: true
	   });
	    auto = new AMap.Autocomplete({    //输入提示
	        input: "keywords"
	    });
	    /*placeSearch = new AMap.PlaceSearch({
	        map: map
	    });  //构造地点查询类*/
	     AMap.event.addListener(auto, "select", select);//注册监听，当选中某条记录时会触发
	     map.addControl(overView);
		 map.addControl(geolocation);
	     geolocation.getCurrentPosition();//获取用户当前的精确位置信息
	  	 AMap.event.addListener(geolocation, 'complete', onComplete);//返回定位信息
	    AMap.event.addListener(geolocation, 'error', onError);      //返回定位出错信息
		var toolBar=new AMap.ToolBar();//显示工具条
		var scale=new AMap.Scale();//显示比例尺
		map.addControl(toolBar);
		map.addControl(scale);
	});
	/*content: "地址："+d.formattedAddress+"<br/>"+"坐标："+d.location.getLng() + ", " + d.location.getLat() +"<br/>"+"匹配级别："+ d.level ,*/
	//实时路况图层
	var trafficLayer=new AMap.TileLayer.Traffic({
	    zIndex: 10
	});

	var isVisible = false;
	AMap.event.addDomListener(document.getElementById('traffic'), 'click', function() {
	    if (isVisible) {
	        trafficLayer.hide();
	        isVisible = false;
	    } else {
	    	trafficLayer.setMap(map);
	        trafficLayer.show();
	        isVisible = true;
	    }
	}, false);
}

/*var lnglatsWgs84=[
	{	lng:87.565794,
		lat:43.817146
		
	},{	lng:87.566931,
		lat:43.817544
	}

];*/
/*var lnglats=[
	[87.41219,43.88174],
	[87.4155108,43.8832666]
];

for(var i=0;i<lnglats.length;i++){
	var marker=new AMap.Marker({
		    icon:"img/icon/position-black.ico",
            position: lnglats[i],
            map: map
        });
    marker.content= '我是第' + (i + 1) + '个Marker';
    marker.on('click',markerClick);
    marker.emit('click', {target: marker});
  // lnglats=coordtransform.wgs84togcj02(lnglatsWgs84[i].lng,lnglatsWgs84[i].lat);
   addMarker();
}*/



/*function markerClick(e) {
        infoWindow.setContent(e.target.content);
        infoWindow.open(map, e.target.getPosition());
    }*/


//关键词查询------第一种
function select(e){
	map.clearMap();
	  var marker = new AMap.Marker({
	       	icon:"img/icon/position-black.ico",
	           position: [e.poi.location.getLng(),e.poi.location.getLat()],
	           map: map
	   });
	  if(e.poi&&e.poi.location){
		  map.setZoom(17);
		  map.setCenter(e.poi.location);
		  
		  //鼠标点击marker弹出自定义的信息窗体
		  AMap.event.addListener(marker, 'click', function() {
			  infoWindow.open(map, marker.getPosition());
			  infoWindow.setContent("经度："+e.poi.location.getLng() + ", 纬度：" + e.poi.location.getLat())
		  });
	  }
}
//关键词查询------第二种
/*function select(e){
	placeSearch.setCity(e.poi.adcode);
	 placeSearch.search(e.poi.name);  //关键字查询
}*/
//解析定位结果
function onComplete(data){
	var str=["定位成功"];
	str.push("经度："+data.position.getLng());
	str.push("纬度："+data.position.getLat());
	str.push('精度：' + data.accuracy + ' 米');
	str.push('地址：' + data.formattedAddress); 
	str.push('是否经过偏移：' + (data.isConverted ? '是' : '否'));
	document.getElementById("tip").innerHTML=str.join("<br>");
		
	}
//解析定位错误信息
function onError(data) {
    document.getElementById('tip').innerHTML = '定位失败';
}
function handleButtonCloseClick(){
	document.getElementsByClassName("close icon")[0].hidden=true;
	document.getElementById('tip').hidden=true;
}



    // 添加Google图层
function addGoogleLayer() {
    googleLayer = new AMap.TileLayer({
        // 图块取图地址
        tileUrl: 'http://mt{1,2,3,0}.google.cn/vt/lyrs=m@142&hl=zh-CN&gl=cn&x=[x]&y=[y]&z=[z]&s=Galil'
    });
    googleLayer.setMap(map);
}
$("#googleLayer").click(function(){
	if($(this).hasClass("active")){
		addGoogleLayer();
		$(this).removeClass("active");
	}else{
		googleLayer.setMap(null);
		$(this).addClass("active");
	}

});
//GPS转到国测局02
var lnglatXY=[];
var infoWindow=new AMap.InfoWindow({
	
	offset: new AMap.Pixel(0, -30)

});
function gpsToGcj02(){
	map.clearMap();
	var lng=parseFloat($("#lng").val());
	var lat=parseFloat($("#lat").val());
	require(["js/coordTransform.js"],function(coordtransform){
		lnglatXY=coordtransform.wgs84togcj02(lng,lat);
	});
	regeocoder();
}
   //逆地理编码
   function regeocoder() { 
	   
        var geocoder = new AMap.Geocoder({
            radius: 1000,
            extensions: "all"
        });        
        geocoder.getAddress(lnglatXY, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                geocoder_CallBack(result);
            }
        });        
        var marker = new AMap.Marker({  //加点
            map: map,
            position: lnglatXY
        });
         //鼠标点击marker弹出自定义的信息窗体
	    AMap.event.addListener(marker, 'click', function(e) {
	    	infoWindow.open(map, marker.getPosition());
	        
	    });
        map.setFitView();
    }
    function geocoder_CallBack(data) {
        var address = data.regeocode.formattedAddress; //返回地址描述
        /*document.getElementById("result").innerHTML = address;*/
        infoWindow.setContent("地址："+address);
   
    };
    //关闭信息窗体
    function closeInfoWindow() {
        map.clearInfoWindow();
    }
