var templates = (function () {

var exports = {};

exports.render = function (name, arg) {
    if (Handlebars.templates === undefined) {
        throw new Error("Cannot find compiled templates!");
    }
    if (Handlebars.templates[name] === undefined) {
        throw new Error("Cannot find a template with this name: " + name
              + ". If you are developing a new feature, this likely "
              + "means you need to add the file static/templates/"
              + name + ".handlebars");
    }

    // The templates should be compiled into compiled.js.  In
    // prod we build compiled.js as part of the deployment process,
    // and for devs we have run_dev.py build compiled.js when templates
    // change.
    return Handlebars.templates[name](arg);
};

// We don't want to wait for DOM ready to register the Handlebars helpers
// below. There's no need to, as they do not access the DOM.
// Furthermore, waiting for DOM ready would introduce race conditions with
// other DOM-ready callbacks that attempt to render templates.

// Regular Handlebars partials require pre-registering.  This allows us to treat
// any template as a partial.  We also allow the partial to be passed additional
// named arguments.  Arguments should alternate between strings which will be
// used as the name and the associated value.
Handlebars.registerHelper('partial', function (template_name) {
    // console.log(template_name)
    var extra_data = {};
    var args_len = arguments.length;
    var i;

    for (i = 1; i < args_len - 2; i += 2) {
        extra_data[arguments[i]] = arguments[i + 1];
    }
    var data = _.extend({}, this, extra_data);
    // console.log(data)
    return new Handlebars.SafeString(exports.render(template_name, data));
});

Handlebars.registerHelper('plural', function (condition, one, other) {
    return (condition === 1) ? one : other;
});
Handlebars.registerHelper('sliceName', function (str) {
     var index = str.indexOf("的")
     var name
     if(index!=-1){
        name= str.slice(0,index)
     }else{
        name =str
     }
     
     return name
});
Handlebars.registerHelper('types', function (str) {
     if (str==="leave"){
        return "请假"
     }else if(str==="evection"){
        return "出差"
     }else if(str==="jobs_please"){
        return  "工作请示"
     }else if (str==="project_progress"){
         return "工程进度"
     }else if(str==="purchase"){
         return "采购申请"
     }else{
         return "报销"
     }
});
// Handlebars.registerHelper('del_string', function (str) {
//     var imgurl = str.substring(1,str.length-1);
//     return imgurl
// })
Handlebars.registerHelper('if_and', function () {
    // Execute the conditional code if all conditions are true.
    // Example usage:
    //     {{#if_and cond1 cond2 cond3}}
    //         <p>All true</p>
    //     {{/if_and}}
    var options = arguments[arguments.length - 1];
    var i;
    for (i = 0; i < arguments.length - 1; i += 1) {
        if (!arguments[i]) {
            return options.inverse(this);
        }
    }
    return options.fn(this);
});
Handlebars.registerHelper('ts', function (timestamp) {

    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        Y = date.getFullYear() + '-';
        M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        D = date.getDate() + ' ';
        h = date.getHours() + ':';
        m = (date.getMinutes()<10 ? '0'+date.getMinutes():date.getMinutes()) + ':';
        s = date.getSeconds()<10 ? '0'+date.getSeconds():date.getSeconds();
    return Y+M+D+h+m+s;
    // return options.inverse(this);
});

Handlebars.registerHelper('tt', function (timestamp) {

    var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        Y = date.getFullYear() + '-';
        M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        D = date.getDate() + ' ';
        h = date.getHours() + ':';
        m = date.getMinutes() + ':';
        s = date.getSeconds();
    return Y+M+D;
    // return options.inverse(this);
});

Handlebars.registerHelper('tf', function (timestamp) {
    // console.log(timestamp)
    if(typeof timestamp == 'string'){
        return timestamp;
    }
    // console.log(timestamp)
    var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        Y = date.getFullYear() + '-';
        M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        D = date.getDate() + ' ';
        h = date.getHours() + ':';
        m = date.getMinutes();
        s = date.getSeconds();
    return h+m;
    // return options.inverse(this);
    // function zeroize( num ) {
    //     return (String(num).length == 1 ? '0' : '') + num;
    // }

    // var curTimestamp = parseInt(new Date().getTime() / 1000); //当前时间戳
    // var timestampDiff = curTimestamp - timestamp; // 参数时间戳与当前时间戳相差秒数

    // var curDate = new Date( curTimestamp * 1000 ); // 当前时间日期对象
    // var tmDate = new Date( timestamp * 1000 );  // 参数时间戳转换成的日期对象

    // var Y = tmDate.getFullYear(), m = tmDate.getMonth() + 1, d = tmDate.getDate();
    // var H = tmDate.getHours(), i = tmDate.getMinutes(), s = tmDate.getSeconds();

    // if ( timestampDiff < 60 ) { // 一分钟以内
    //     return "刚刚";
    // } else if( timestampDiff < 3600 ) { // 一小时前之内
    //     return Math.floor( timestampDiff / 60 ) + "分钟前";
    // } else if ( curDate.getFullYear() == Y && curDate.getMonth()+1 == m && curDate.getDate() == d ) {
    //     return '今天' + zeroize(H) + ':' + zeroize(i);
    // } else {
    //     var newDate = new Date( (curTimestamp - 86400) * 1000 ); // 参数中的时间戳加一天转换成的日期对象
    //     if ( newDate.getFullYear() == Y && newDate.getMonth()+1 == m && newDate.getDate() == d ) {
    //         return '昨天' + zeroize(H) + ':' + zeroize(i);
    //     } else if ( curDate.getFullYear() == Y ) {
    //         return  zeroize(m) + '月' + zeroize(d) + '日 ' + zeroize(H) + ':' + zeroize(i);
    //     } else {
    //         return  Y + '年' + zeroize(m) + '月' + zeroize(d) + '日 ' + zeroize(H) + ':' + zeroize(i);
    //     }
    // }
});
Handlebars.registerHelper("deleteTag",function(tagStr){
        var regx = /<[^>]*>|<\/[^>]*>/gm;
        var result = tagStr.replace(regx, '');
        return result;
})
Handlebars.registerHelper("replaceTag",function(repStr){
    var $repStr = $(repStr)
    var content = $repStr.text()
    var img_content = $repStr.eq(-1).hasClass("message_inline_image")
    // console.log(img_content,$repStr.eq(-1))
    var lastContent = content.substr(-4)
    var tagA = $repStr.find("a").length
    if(tagA===1&&lastContent==".aac"){
        var li = '<p>\
                    <audio controls="controls" >\
                    <source src='+content+' type="audio/ogg"/>\
                    Your browser does not support the audio element\
                    </audio>\
                </p>'
             repStr = li
            return  repStr
    }else if(img_content){
      var index = repStr.indexOf("</p>")
      repStr = repStr.slice(index+4)
    //   console.log(repStr)
      return  repStr
    }else{
        return repStr
    }


})
Handlebars.registerHelper("tl", function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
});
Handlebars.registerHelper("tj",function(str){
    var p = str.indexOf(".");
    var strs = str.substring(p);
    return strs;
})
Handlebars.registerHelper('addKey',function(index){
    return index + 1;
});
Handlebars.registerHelper('nfirst',function(name){
    return name.slice(0,1);
});
// Handlebars.registerHelper('nindex',function(index){
//    if(index>4){
//         return true
//    }
// });
Handlebars.registerHelper('contents',function(content){
    var str = window.location.hash.split(/\//).pop()
    var string = decodeURIComponent(str.replace(/\./g, '%'));
    if(content === string){
        return "backcolor"
    }
});

Handlebars.registerHelper('content_color',function(content){
    var str = window.location.hash.split(/\//).pop()
    var string = decodeURIComponent(str.replace(/\./g, '%'));
    if(content === string){
        return "content_color"
    }
});
// Handlebars.registerHelper('buttonStatus',function(content){
//     if(content===1){
//         contents  =["催办",'撤销']
//     }else if(content === 2 ){
//         contents =  ['不同意','同意']
//     }else if(content ===3 ){
//         contents  =  ['反馈']
//     }
//     else if(content ===4 ){
//         contents  =  ['已撤销']
//     }
//     else if(content ===5){
//         contents  =  ['再次提交']
//     }
//     return contents
// });
Handlebars.registerHelper("tp",function(str){
    if(str == "day"){
        str = "日报"
    }else if(str == "month"){
        str = "月报"
    }else if(str == "week"){
        str = "周报"
    }
    return str;
})
Handlebars.registerHelper("substrMonth",function(str){
    var s = str.substring(5,10);
    return s;
})
Handlebars.registerHelper("substrYear",function(str){
    var s = str.substring(0,10);
    return s;
})
Handlebars.registerHelper("toNorm",function(str){
    var regx = /[a-zA-Z]/gm
    var str = str.replace(regx,'')
    str = str.replace(/-/g,'/')
    var left = str.substring(0,10)
    var right = str.substring(10,15)
    var middle = "\r\n"
    return left+middle+right
})
//文件类型判断
Handlebars.registerHelper("isJpg",function(str){
    if(str == "jpg"){
        return true;
    }else{
        return false;
    }
})
//输入当月月份
Handlebars.registerHelper('outMonth',function(month_week,month_count,no_normal_list,normal_list,outside_work_list,year,month){
                var arr=[]
                var firstDay = month_week;
                var lastDay = month_count;
                var year = year;
                var month = month;
                function stateColor(){
                    for(var key in no_normal_list){
                        $(".calendar_list_num[value='"+no_normal_list[key]+"']").next().addClass("calendar_list_stateR")
                    }
                    for(var key in normal_list){
                        $(".calendar_list_num[value='"+normal_list[key]+"']").next().addClass("calendar_list_stateG")
                    }
                    for(var key in outside_work_list){
                        $(".calendar_list_num[value='"+outside_work_list[key]+"']").next().addClass("calendar_list_stateY")
                    }
                }
                if(firstDay==1){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    for(var i=1;i<lastDay+1;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==2){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+2;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==3){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+3;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==4){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+4;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==5){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+5;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==6){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+6;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }else if(firstDay==7){
                    var out = '<ul class="calendar_list">';
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    arr.unshift("");
                    for(var i=1;i<lastDay+7;i++){
                        arr.push(i)
                        out = out + '<li class="calendar_list_date"><p class="calendar_list_num" month='+month+' year='+year+' value='+arr[i]+'>'+arr[i]+'</p><p class=""></p></li>'
                    }
                    $("body").ready(function () {
                        stateColor()
                    })
                    return out + '</ul>';
                }
})
Handlebars.registerHelper('compareDate', function(left, operator, right, options) {
    var operators = {
      '==':     function(l, r) {return l == r; },
      '===':    function(l, r) {return l === r; },
      '!=':     function(l, r) {return l != r; },
      '!==':    function(l, r) {return l !== r; },
      '<':      function(l, r) {return l < r; },
      '>':      function(l, r) {return l > r; },
      '<=':     function(l, r) {return l <= r; },
      '>=':     function(l, r) {return l >= r; },
      'typeof': function(l, r) {return typeof l == r; }
    };
    left = left.substring(0,4)
    right = right.substring(0,4)
    var result = operators[operator](left, right);

    if (result) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
    // Example usage:
    // {{#compare type '==' 'txt'}}
    //     {{else}}
    // {{/compare}}
});

Handlebars.registerHelper('compare', function(left, operator, right, options) {
    if (arguments.length < 3) {
      throw new Error('Handlerbars Helper "compare" needs 2 parameters');
    }
    var operators = {
      '==':     function(l, r) {return l == r; },
      '===':    function(l, r) {return l === r; },
      '!=':     function(l, r) {return l != r; },
      '!==':    function(l, r) {return l !== r; },
      '<':      function(l, r) {return l < r; },
      '>':      function(l, r) {return l > r; },
      '<=':     function(l, r) {return l <= r; },
      '>=':     function(l, r) {return l >= r; },
      'typeof': function(l, r) {return typeof l == r; }
    };

    if (!operators[operator]) {
      throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
    }

    var result = operators[operator](left, right);

    if (result) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
    // Example usage:
    // {{#compare type '==' 'txt'}}
    //     {{else}}
    // {{/compare}}
});
//取数组长度
Handlebars.registerHelper("cut_list",function(list){
    return list.length
})
//只截取时间点
Handlebars.registerHelper("cut_time",function(str){
    if(str != undefined){
        return str.substring(11,19)
    }
})
//显示名字
Handlebars.registerHelper("short_names",function(str){
    if(str.length>4){
        str = str.slice(0,4)+"..."
       return str
    }
    return str
})
Handlebars.registerHelper('if_or', function () {
    // Execute the conditional code if any of the conditions are true.
    // Example usage:
    //     {{#if_or cond1 cond2 cond3}}
    //         <p>At least one is true</p>
    //     {{/if_or}}
    var options = arguments[arguments.length - 1];
    var i;
    for (i = 0; i < arguments.length - 1; i += 1) {
        if (arguments[i]) {
            return options.fn(this);

        }
    }
    return options.inverse(this);
});

Handlebars.registerHelper('t', function (i18n_key) {
    // Marks a string for translation.
    // Example usage:
    //     {{t "some English text"}}
    var result = i18n.t(i18n_key);
    return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('tr', function (context, options) {
    // Marks a block for translation.
    // Example usage 1:
    //     {{#tr context}}
    //         <p>some English text</p>
    //     {{/tr}}
    //
    // Example usage 2:
    //     {{#tr context}}
    //         <p>This __variable__ will get value from context</p>
    //     {{/tr}}
    //
    // Notes:
    //     1. `context` is very important. It can be `this` or an
    //        object or key of the current context.
    //     2. Use `__` instead of `{{` and `}}` to declare expressions
    var result = i18n.t(options.fn(context), context);
    return new Handlebars.SafeString(result);
});
Handlebars.registerHelper("formatFileSize",function(str){

        var str = Number(str);
        if (str > 1024) {
        if ((str / 1024) > 100) {
        if ((str / 1024 / 1024) > 100) {
        return (str / 1024 / 1024 / 1024).toFixed(2)+ 'GB';
        }
        return (str / 1024 / 1024).toFixed(2)+'MB';
        }
        return (str / 1024).toFixed(2)+'KB';
        }
        return str +'B';
})
return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = templates;
}
