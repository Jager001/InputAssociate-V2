# InputAssociate-V2

输入联想控件版本2

本次将控件改写成单例模式，模式如下：

$.tabControl = $.tabControl || {};

$.extend($.tabControl,{
    prop1:”abc”,//注意此处为单例类实例
	init:function($self,options){
  		alert(this.prop1);//this是tabControl类实例，$self为控件本身
	}
});

$.fn.tab = function(options) {
	if (typeof options == 'string') {
		var fn = $.tabControl[options];
		if (!fn) {
			throw ("tabControl - No such method: " + options);
		}
		var args = $.makeArray(arguments).slice(1);
		args.unshift($(this));
		return fn.apply($.tabControl, args);
	}else{
		return this.each( function() {
			$(this).tab('init',options);
		});
	}
};

但是该版本的代码是有问题的，lookup.js里面包含的this $(this)逻辑不清楚，上传该版本的目的是为了备注开发过程中所进的一个代码思维怪圈，对今后的编码有一定借鉴作用
