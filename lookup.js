/**
 * 控件方法调用入口
 * @param {Object} options
 */
$.fn.lookup = function(options) {
	
	if (typeof options == 'string') {
		
		var fn = $.lookupControl[options];
		
		if (!fn) {
			throw ("lookupControl - No such method: " + options);
		}
		
		if(arguments[0] == 'lookupScroll') {
			return fn;
		}
		
		var args = $.makeArray(arguments).slice(1);
		
		if(arguments[0] == 'init') {
			args.unshift($(this));
		}
		
		return fn.apply($.lookupControl, args);
		
	}else{
		
		return this.each( function() {
			$(this).lookup('init',options);
		});
	}
};

$.lookupControl = $.lookupControl || {};

/**
 * 控制类，具体方法实现
 */
$.extend($.lookupControl,{
	
	// 热门是否重载标示
	lookupHotReloadTag1: "",
	lookupHotReloadTag2: "",
	
	// 输入联想控件全局配置属性--单例类实例
    lookupConfig: {},
    
    // 分页滚动对象
    lookupScroll: {},
    
    // 控件初始化
	init: function ($self,options) {
		
  		// 控件自定义配置
        var selfConfig = {};

        // 输入框提示文字
        selfConfig.placeHolder = !Util.isEmptyStr(options.placeHolder) ? options.placeHolder : '关键字..';

        // 控件主题颜色
        selfConfig.themeColor = !Util.isEmptyStr(options.themeColor) ? options.themeColor : "#0A9EE5";

        // 控件的弹出方式，默认从右边弹出，目前支持right
        selfConfig.showStyle = "right";

        // 默认不显示热门搜索
        selfConfig.showHotSearch = options.showHotSearch === "true" ? "true" : "false";
        
        // 热门搜索最多个数，默认最多显示10个
        selfConfig.hotSearchMax = options.hotSearchMax ? options.hotSearchMax : 10;

        // 默认显示搜索历史
        selfConfig.showHistory = options.showHistory === "false" ? "false" : "true";

        // 屏幕宽度高度
    	selfConfig.screenWidth = $(window).width();
    	selfConfig.screenHeight = $(window).height();

        // 请求的service
    	var serviceName = options.lookupservice;
    	var serviceObj = $(this).lookup("getServiceByName", serviceName);
    	selfConfig.serviceName = serviceName;
    	selfConfig.serviceObj = serviceObj;
    		
        // 搜索历史本地存储键值--采用lookupkey
    	var storeKey = options.lookupkey;
    	selfConfig.storeKey = storeKey;
        
        // 调用控件ID
    	var inputId = $self.attr("id");
    	selfConfig.inputId = inputId;
    	
    	// 联想列表分页当前页,默认是1
    	selfConfig.currentPage = 1;

        // 配置初始化
    	$(this).lookup("setConfig", selfConfig);

        // 输入框添加清空按钮
    	if (typeof ($self.attr("data-clear-btn")) === "undefined" && !$self.textinput("option", "clearBtn")) {
    	    $self.textinput("option", "clearBtn", true);
    	}

        // 判断如果是动态绑定，需要加上data-myctl标记
    	if (typeof($self.attr("data-myctl")) === "undefined") {
    	    $self.attr("data-myctl", "lookup");
    	}
    		
        // 判断是否构建面板
    	if($("#assPanelId0000").length == 0) {

    	    var assPanelHtml = $(this).lookup("buildAssPanelHtml");

	    	var pageId = MyApp.getCurrentPageId();
	    	$("#" + pageId).append(assPanelHtml).trigger("create");
	    	
	    	$(this).lookup("bindSlideUp");
           
    	} else {
    	    // 重置面板属性
    	    var newAssPanelHeaderHtml = $(this).lookup("buildAssPanelHeaderHtml");
    	    $("#assPanelHeaderId0000").html(newAssPanelHeaderHtml).trigger("create");
    	}

        // 绑定输入事件
    	$("#assSearchId0000").off("input propertychange");
    	$("#assSearchId0000").on("input propertychange", this._keyupFn);

        // 初始化打开panel
    	$("#assListId0000").html("");
    	$("#assPanelId0000").css("display", "");
    	$("#assPanelId0000").panel("open");
    	$("#lookupScrollerWrapper").css("display", "none");

        // 获取热门搜索
    	if (storeKey != this.lookupHotReloadTag1 || inputId != this.lookupHotReloadTag2) {

    	    this.lookupHotReloadTag1 = storeKey;
    	    this.lookupHotReloadTag2 = inputId;

    	    $("#assHotDivId0000").html("").trigger("create");

    	    if (selfConfig.showHotSearch === "true") {
    	        setTimeout("$(this).lookup('getHotSearchData')", 300);
    	    } else {
    	        $("#assHotDivId0000").css("display", "none");
    	    }
    	}

    	// 加载搜索历史
    	var storeArray = store.get(storeKey);
    	if (selfConfig.showHistory = "true" && storeArray && storeArray.length > 0) {
    	    $(this).lookup("getHistoryData")
    	} else {
    	    $("#assHistoryDivId0000").css("display", "none");
    	}
	},
	
    // 获取控件配置属性
    getConfig: function() {
        return this.lookupConfig;
    },

    // 设置控件配置属性
    setConfig: function (config) {
        this.lookupConfig = config;
    },

    // 控件--构建面板html
    buildAssPanelHtml: function () {

        var config = $(this).lookup("getConfig");

        var buff = [];
        buff.push("<style>.ui-panel-inner {padding:0px;}</style>");
        buff.push("<div data-role='panel' id='assPanelId0000' data-position='" + config.showStyle + "' data-swipe-close='false' data-dismissible='false' data-position-fixed='true' data-display='overlay' data-theme='a' style='display:none;width:" + config.screenWidth + "px;'>");
        buff.push("<div id='assPanelHeaderId0000'>");
        buff.push($(this).lookup("buildAssPanelHeaderHtml"));
        buff.push("</div>");
        buff.push(
        	"<div id='lookupScrollerWrapper'>"+
	        	"<div>"+
					"<div>"+
		        		"<ul data-role='listview' id='assListId0000'></ul>"+
		        	"</div>"+
		        	"<div id='lookupScrollerPullUp' style='display:none'>"+
		        		"<span>上拉加载更多</span>"+
		        	"</div>"+
	        	"</div>"+
        	"</div>"
        );
        buff.push("<div id='assHotHistoryDivId0000' style='padding-top:54px;'><div id='assHotDivId0000'></div><div id='assHistoryDivId0000'></div></div>");
        buff.push("</div>");

        return buff.join('');
    },
	
    // 控件--构建面板头部html
    buildAssPanelHeaderHtml: function () {

        var config = $(this).lookup("getConfig");

        var picBackPath = MyApp.getAbsolutePath("images/core/img_ass_back.png");
        var picSearchPath = MyApp.getAbsolutePath("images/core/img_ass_search.png");

        var assPanelHeaderHtml = 
        "<div style='background-color:" + config.themeColor + ";width:100%;height:52px;position:fixed;z-index:99'>" +
            "<div style='padding:10px;height:32px;line-height:32px;'>" +
                "<div style='float:left;width:10%;' onclick='$(this).lookup(\"closeAssPanel\")'>" +
                    "<div style='text-align:center'><img style='margin:auto' src='" + picBackPath + "'></div>" +
                "</div>" +
                "<div style='float:left;padding-left:1%;width:79%;'>" +
                    "<input id='assSearchId0000' type='text' style='width:92%;height:28px;border:0px;padding:0 8px;' data-role='none' placeholder='" + config.placeHolder + "'>" +
                "</div>" +
                "<div style='float:left;width:10%;' onclick='$(this).lookup(\"associateKey\", 0)'>" +
                    "<div style='text-align:center'><img style='margin:auto' src='" + picSearchPath + "'></div>" +
                "</div>" +
            "</div>" +
        "</div>";

        return assPanelHeaderHtml;
    },

    // 控件--绑定输入事件--私有方法
    _keyupFn: function () {

        var config = $(this).lookup("getConfig");
        var inputObj = $("#"+config.inputId);

        //最后请求数据的时间
        var lastTime = $(inputObj).data("lastTime");
        var now = new Date().getTime();
        lastTime = lastTime ? lastTime : now;
        var time = lastTime + 600 - now;

        if (time <= 0) {
            //超过最小间隔时间
            $(inputObj).data("lastTime", now);
            $(this).lookup("associateKey",0);

        } else {
            //未超过最小间隔时间，就延迟请求
            setTimeout(function () {
                $(inputObj).data("lastTime", new Date().getTime());
                $(this).lookup("associateKey",0);
            }, time);
        }

    },

    // 控件--给调用控件的输入框赋值
    setInputData: function (keyValue, textValue) {

        var config = $(this).lookup("getConfig");

        //设置控件的值
        Util.setMyCtlValue(config.inputId, keyValue, textValue);

        // 输入框聚焦
        $("#" + config.inputId).focus();

        // 关闭搜索面板
        $(this).lookup("closeAssPanel");
    },

    // 控件--根据service名字获取service对象
    getServiceByName: function (name) {
        var obj;
        for (var i = 0; i < Services.length; i++) {
            if (Services[i].name === name) {
                obj = Services[i];
                break;
            }
        }
        if (!Util.isNullObj(obj)) {
            return obj;
        } else {
            return DefaultService;
        }
    },

    // 热门面板--获取后台数据
    getHotSearchData: function () {

        var config = $(this).lookup("getConfig");
        
        // 调用上行代理
        var queryInfo = $(this).postHotProxyData(config.serviceName, config.storeKey);

        var opt = new CInvokeOption('lookupHot', queryInfo);

        config.serviceObj.invoke(opt,
            function (rst) {
                // 调用下行代理
                var obj = $(this).loadHotProxyData(config.serviceName, rst.data);
                
                var htmlStr = $(this).lookup("buildAssHotSearchHtml", obj.data);
                $("#assHotDivId0000").html(htmlStr);
                $("#assHotDivId0000").css("display", "");
            },
            function (errObj) {
                //请求失败后的处理
            },
            function () {
                //请求前的处理
            },
            function () {
                //请求后的处理，不管成功还是失败都会执行
            });
    },

    // 热门面板--构建块html
    buildAssHotSearchHtml: function (array) {

        var config = $(this).lookup("getConfig");

        var buff = [];
        buff.push("<div style='padding:15px 0 0 15px;'>热门</div>");
        buff.push("<div style='padding:15px 15px 0 15px;overflow:hidden'>");

        for (var i = 0; i < array.length && i < config.hotSearchMax; i++) {
            buff.push("<a style='height:24px;line-height:24px;display:block;float:left;padding:0 10px;margin: 0 8px 8px 0;background-color:#F2F2F2;color:" + config.themeColor + ";font-size:12px;white-space: nowrap;'" +
            " onclick='$(this).lookup(\"setInputData\", \"" + array[i].id + "\",\"" + array[i].name + "\")'>" + array[i].name + "</a>");
        }

        buff.push("</div>");
        return buff.join('');
    },

    // 搜索历史--获取本地缓存数据
    getHistoryData: function () {

        var htmlStr = $(this).lookup("buildAssHistoryHtml");
        $("#assHistoryDivId0000").html(htmlStr).trigger("create");
        $("#assHistoryListId0000").listview("refresh");
        $("#assHistoryDivId0000").css("display", "");
    },

    // 搜索历史--构建块html
    buildAssHistoryHtml: function () {

        var config = $(this).lookup("getConfig");

        var buff = [];
        buff.push("<div style='padding:15px 0 15px 15px;'>搜索历史</div>");
        buff.push("<ul id='assHistoryListId0000' data-role='listview'>");

        buff.push($(this).lookup("buildAssHistoryListHtml"));

        buff.push("</ul>");
        buff.push("<div style='text-align:center;padding:10px 0;'><a onclick='$(this).lookup(\"cleanAssHistory\")' style='text-shadow:none;color:#fff;background-color:" + config.themeColor + "' class='ui-btn ui-mini ui-corner-all ui-btn-inline'>清除搜索历史</a></div>");

        return buff.join('');
    },

    // 搜索历史--构建数据列表
    buildAssHistoryListHtml: function () {

        var config = $(this).lookup("getConfig");

        var picPath = MyApp.getAbsolutePath("images/core/img_ass_delete.png");

        var buff = [];
        var storeArray = store.get(config.storeKey);
        for (var i = 0; i < storeArray.length; i++) {
            buff.push
	        ("<li style='color:grey'>" +
	    	    "<div style='float:left;width:90%;' onclick='$(this).lookup(\"clickHistoryList\", \"" + storeArray[i] + "\")'>" +
	    		    storeArray[i] +
    		    "</div>" +
		        "<div style='float:right;'>" +
		    	    "<img src='" + picPath + "' class='ui-li-icon' onclick='$(this).lookup(\"deleteAssHistoryItem\", \"" + storeArray[i] + "\");'>" +
		        "</div>" +
	        "</li>");
        }
        return buff.join('');
    },

    // 搜索历史--点击搜索历史
    clickHistoryList: function (str) {
        $("#assSearchId0000").val(str);
        $(this).lookup("associateKey", 0);
    },

    // 搜索历史--添加
    addSearchHistory: function (str) {

        var config = $(this).lookup("getConfig");

        var oldArr = store.get(config.storeKey);
        if (oldArr) {
            for (var i = 0; i < oldArr.length; i++) {
                if (oldArr[i] === str) {
                    oldArr.splice(i, 1); // 如果数据组存在该元素，则把该元素删除
                    break;
                }
            }
            oldArr.unshift(str); // 再添加到第一个位置
            store.set(config.storeKey, oldArr);
        } else {
            var newArr = new Array();
            newArr.unshift(str);
            store.set(config.storeKey, newArr);
        }
    },

    // 搜索历史--删除
    deleteSearchHistory: function (str) {

        var config = $(this).lookup("getConfig");

        var oldArr = store.get(config.storeKey);
        if (oldArr) {
            for (var i = 0; i < oldArr.length; i++) {
                if (oldArr[i] === str) {
                    oldArr.splice(i, 1); // 如果数据组存在该元素，则把该元素删除
                    break;
                }
            }
            store.set(config.storeKey, oldArr);
        } else {
            return false;
        }
    },

    // 搜索历史--单项删除
    deleteAssHistoryItem: function (str) {

        var config = $(this).lookup("getConfig");

        $(this).lookup("deleteSearchHistory", str);

		$(this).lookup("refreshAssHistoryDiv");

        if (store.get(config.storeKey).length == 0) {
            $("#assHistoryDivId0000").css("display", "none");
        }
    },

    // 搜索历史--清空
    cleanAssHistory: function () {

        var config = $(this).lookup("getConfig");

        store.remove(config.storeKey);

        $("#assHistoryDivId0000").css("display", "none");
    },

    // 搜索历史--刷新
    refreshAssHistoryDiv: function () {

        $("#assHistoryDivId0000").css("display", "");
        $("#assHistoryListId0000").html("");

        var lis = $(this).lookup("buildAssHistoryListHtml");
        $("#assHistoryListId0000").html(lis);
        $("#assHistoryListId0000").listview("refresh");
    },

    // 数据联想--关键词查询,tag=0 输入查询或点击查询, tag=1 翻页查询
    associateKey: function (tag) {

        var keyword = $("#assSearchId0000").val();

        if (keyword) {
            $("#assHotHistoryDivId0000").css("display", "none");
            $("#lookupScrollerWrapper").css("display", "");
            $(this).lookup("getAssData", tag, keyword);
        } else {
            $("#assListId0000").html("");
            $("#assHotHistoryDivId0000").css("display", "");
            $("#lookupScrollerWrapper").css("display", "none");
        }
    },

    // 数据联想--获取后台数据
    getAssData: function (tag, keyword) {

        var config = $(this).lookup("getConfig");
        
        var page = config.currentPage;
        
        // 调用上行代理
        var queryInfo = $(this).postProxyData(config.serviceName, config.storeKey, keyword, page);
        
        var opt = new CInvokeOption('lookup', queryInfo);

        config.serviceObj.invoke(opt,
            function (rst) {
                // 调用下行代理
                var obj = $(this).loadProxyData(config.serviceName, rst.data);
                var htmlStr = $(this).lookup("buildAssListHtml", obj.data);
                
                // tag=0 输入查询或点击查询, tag=1 翻页查询
                if(typeof(tag)!="undefined" && tag == 0) {
                	
		    		// 分页从1重新开始
			        config.currentPage = 1;
			        $("#assListId0000").html(htmlStr);
			        
		    	}else if(obj.hasMoreData) {
                	
			        config.currentPage = page+1;
			        $("#assListId0000").append(htmlStr);
                	
                } else {
                	MyApp.showFloatMsg("已是最后一页");
                }
                
                $(this).lookup("setConfig", config);
                $("#assListId0000").listview("refresh");
                
                $(this).lookup("lookupScroll").refresh();
                $("#lookupScrollerPullUp").css("display", "none");
                
            },
            function (errObj) {
                //请求失败后的处理
            },
            function () {
                //请求前的处理
            },
            function () {
                //请求后的处理，不管成功还是失败都会执行
            });
    },

    // 数据联想--构建联想html
    buildAssListHtml: function (array) {

        var picPath = MyApp.getAbsolutePath("images/core/img_ass_item.png");
        var buff = [];

        for (var i = 0; i < array.length; i++) {
            buff.push('<li onclick=\'$(this).lookup("clickAssList","' + array[i].id + '","' + array[i].name + '")\'><img src="' + picPath + '" alt="" class="ui-li-icon">' + array[i].name + '</li>');
        }
        if (buff.length == 0) {
            buff.push('<li style="color:grey;">暂无搜索结果.</li>');
        }
        return buff.join('');
    },

    // 数据联想--绑定上拉刷新
	bindSlideUp: function() {
		
		this.lookupScroll = new IScroll('#lookupScrollerWrapper', { probeType: 3, mouseWheel: true, click: true });
		
		this.lookupScroll.on("scroll", function() {
			if(this.maxScrollY - this.y >= 40){
				$("#lookupScrollerPullUp").css("display", "");
			}
		});
		
		this.lookupScroll.on("slideUp", function() {
			if(this.maxScrollY - this.y >= 40) {
				this.scrollTo(0, this.maxScrollY-47, 3000, IScroll.utils.ease.back);
				$(this).lookup("associateKey");
			}
		});
		
		$('#lookupScrollerWrapper').on('touchmove', function(){
			var ls = $(this).lookup("lookupScroll");
		 	if(ls.maxScrollY - ls.y >= 40){
		 		$('#lookupScrollerPullUp').html("释放加载更多");
			} 
		});
		
		$('#lookupScrollerWrapper').on('touchend', function(){
			var ls = $(this).lookup("lookupScroll");
		 	if(ls.maxScrollY - ls.y >= 40){
		 		$('#lookupScrollerPullUp').html("正在加载..");
			} else {
				$('#lookupScrollerPullUp').html("上拉加载更多");
			}
		});
		
	},
	
    // 数据联想--点击联想列表
    clickAssList: function (keyValue, textValue) {

        // 设置控件的值
        $(this).lookup("setInputData", keyValue, textValue);

        // 获取搜索关键字并存储
        var searchKeyword = $("#assSearchId0000").val();

        // 添加搜索历史
        $(this).lookup("addSearchHistory", searchKeyword);

        // 刷新搜索历史div
        $(this).lookup("refreshAssHistoryDiv");
    },

    // 数据联想--关闭联想面板
    closeAssPanel: function () {

	    $('#assListId0000').html("");
	    $("#assPanelId0000").panel("close");
	    $("#assHotHistoryDivId0000").css("display","");
    }
    
});

