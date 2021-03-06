var server_events = (function () {

    var exports = {};

    var waiting_on_homeview_load = true;

    var events_stored_while_loading = [];

    var get_events_xhr;
    var get_events_timeout;
    var get_events_failures = 0;
    var get_events_params = {};
    var arr = []
    var push_data = []
    // This field keeps track of whether we are attempting to
    // force-reconnect to the events server due to suspecting we are
    // offline.  It is important for avoiding races with the presence
    // system when coming back from unsuspend.
    exports.suspect_offline = false;
    // i = 80000
    // function scrollToEnd(){//滚动到底部
    //     var x = $("#zfilt").height()
    //     i += 800
    //     var h = 8000 + i;
    //     $(".tab-content").scrollTop(h);
    //     var scrollHeight = $("#zfilt").prop("scrollHeight")
    //     $("#zfilt").scrollTop(scrollHeight+h)

    // }
    function get_events_success(events) {
        var messages = [];
        var messages_to_update = [];
        var new_pointer;

        var clean_event = function clean_event(event) {
            // Only log a whitelist of the event to remove private data
            return _.pick(event, 'id', 'type', 'op');
        };

        _.each(events, function (event) {
            try {
                get_events_params.last_event_id = Math.max(get_events_params.last_event_id,
                    event.id);
            } catch (ex) {
                blueslip.error('Failed to update last_event_id', {
                        event: clean_event(event)
                    },
                    ex.stack);
            }
        });

        if (waiting_on_homeview_load) {
            events_stored_while_loading = events_stored_while_loading.concat(events);
            return;
        }

        if (events_stored_while_loading.length > 0) {
            events = events_stored_while_loading.concat(events);
            events_stored_while_loading = [];
        }

        // Most events are dispatched via the code server_events_dispatch,
        // called in the default case.  The goal of this split is to avoid
        // contributors needing to read or understand the complex and
        // rarely modified logic for non-normal events.
        var dispatch_event = function dispatch_event(event) {
            switch (event.type) {
                case 'message':
                    var msg = event.message;
                    msg.flags = event.flags;
                    if (event.local_message_id) {
                        msg.local_id = event.local_message_id;
                        sent_messages.report_event_received(event.local_message_id);
                    }
                    messages.push(msg);
                    break;

                case 'pointer':
                    new_pointer = event.pointer;
                    break;

                case 'update_message':
                    messages_to_update.push(event);
                    break;

                default:
                    return server_events_dispatch.dispatch_normal_event(event);
            }
        };

        _.each(events, function (event) {
            try {
                dispatch_event(event);
            } catch (ex1) {
                blueslip.error('Failed to process an event\n' +
                    blueslip.exception_msg(ex1), {
                        event: clean_event(event)
                    },
                    ex1.stack);
            }
        });

        if (messages.length !== 0) {
            // Sort by ID, so that if we get multiple messages back from
            // the server out-of-order, we'll still end up with our
            // message lists in order.
            messages = _.sortBy(messages, 'id');
            try {
                messages = echo.process_from_server(messages);
                _.each(messages, message_store.set_message_booleans);
                message_events.insert_new_messages(messages);
                // scrollToEnd()
            } catch (ex2) {
                blueslip.error('Failed to insert new messages\n' +
                    blueslip.exception_msg(ex2),
                    undefined,
                    ex2.stack);
            }
        }

        if (new_pointer !== undefined &&
            new_pointer > pointer.furthest_read) {
            pointer.furthest_read = new_pointer;
            pointer.server_furthest_read = new_pointer;
            home_msg_list.select_id(new_pointer, {
                then_scroll: true,
                use_closest: true
            });
        }

        if ((home_msg_list.selected_id() === -1) && !home_msg_list.empty()) {
            home_msg_list.select_id(home_msg_list.first().id, {
                then_scroll: false
            });
        }

        if (messages_to_update.length !== 0) {
            try {
                message_events.update_messages(messages_to_update);
            } catch (ex3) {
                blueslip.error('Failed to update messages\n' +
                    blueslip.exception_msg(ex3),
                    undefined,
                    ex3.stack);
            }
        }
    }
    exports.get_my_avater = function (id, user_list) {
        for (var key in user_list) {
            if (id == user_list[key].id) {
                return user_list[key].user_avatar
            }
        }
    }
    exports.tf = function (timestamp) {
        var date = new Date(timestamp * 1000);
        Y = date.getFullYear() + '-';
        M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        D = date.getDate() + ' ';
        h = date.getHours() + ':';
        m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
        s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
        return h + m;
    }
    
    exports.set_local_news = function (send_id, stream_id, name, avatar, time, content, _href,stream,short_name,time_stamp) {
        obj = {
            send_id: send_id,
            stream_id: stream_id ? stream_id : '',
            name: name,
            avatar: avatar,
            time: time,
            content: content,
            _href: _href,
            stream:stream?stream:"",
            short_name:short_name?short_name:"",
            time_stamp:time_stamp?time_stamp:0
        }
        return obj
    }
    exports.deleteTag = function (tagStr) {
        var regx = /<[^>]*>|<\/[^>]*>/gm;
        var result = tagStr.replace(regx, '');
        return result;
    };
    exports.operating_hints = function(msg){
        $(".operating_hints_box").fadeIn().delay(1500).fadeOut()
        $(".operating_hints_ctn").html(msg)
    }
    exports.sortBytime = function (){
        var ul = $(".persistent_data");
        var lis = [];
        lis = $(".persistent_data a");
        var ux = [];
        //循环提取时间，并调用排序方法进行排序
        for (var i=0; i<lis.length; i++){
            var tmp = {};
            tmp.dom = lis.eq(i);
          
            tmp.date = Number(lis.eq(i).children().attr("time_stamp"));
            ux.push(tmp);
        }
       
        ux.sort(function(a,b){
        return a.date - b.date;
        });
        
        //移除原先顺序错乱的li内容
        $('.persistent_data a').remove();
        //重新填写排序好的内容
        for (var i=0; i<ux.length; i++){
            ul.append(ux[i].dom);
         
        }
    }
    function get_events(options) {
        options = _.extend({
            dont_block: false
        }, options);

        if (reload.is_in_progress()) {
            return;
        }

        get_events_params.dont_block = options.dont_block || get_events_failures > 0;

        if (get_events_params.dont_block) {
            // If we're requesting an immediate re-connect to the server,
            // that means it's fairly likely that this client has been off
            // the Internet and thus may have stale state (which is
            // important for potential presence issues).
            exports.suspect_offline = true;
        }
        if (get_events_params.queue_id === undefined) {
            get_events_params.queue_id = page_params.queue_id;
            get_events_params.last_event_id = page_params.last_event_id;
        }
    get_events_params.client_gravatar = true;
    get_events_timeout = undefined;
    get_events_xhr = channel.get({
        url:      '/json/events',
        data:     get_events_params,
        idempotent: true,
        timeout:  page_params.poll_timeout,
        success: function (data) { 
            console.log(data)         
            for(var i = 0;i<data.events.length;i++){
                type = data.events[0].zg_type
                push_one = data.events[0]
            }
            if(type == 'DailyReport'){
                var now_count = Number($(".log_assistant_count").text())
                if(now_count){
                    $(".log_assistant_count").text(now_count+1)
                    $(".last_log").text(push_one.theme)
                }else{
                    $(".log_assistant_count").parent().show()
                    $(".log_assistant_count").text(1)
                    $(".last_log").text(push_one.theme)
                }
                $(".work_order").show()
                localStorage.setItem("pushData",JSON.stringify(push_data))
                $(".keep_exist .notice_bottom").html(push_one.theme)
                $(".keep_exist .notice_top_time").html(server_events.tf(push_one.time))
                server_events.showNotify(push_one.user_name,push_one.theme)
            }else if(type == 'JobsNotice'){
                $(".work_order").show()
                push_data.push(push_one)
                localStorage.setItem("pushData",JSON.stringify(push_data))
                $(".work_order .notice_bottom").html(push_one.theme)
                $(".work_order .notice_top_time").html(server_events.tf(push_one.time))
                server_events.showNotify(push_one.user_name,push_one.theme)
            }else if(type=="del_subject"){
                // console.log(push_none)
                // var stream_id = push_none.stream_id
                // var stream_name = stream_data.get_sub_by_id(stream_id)
                server_events.showNotify(push_one.subject,"删除话题"+push_one.subject)
                // var stream_id = data.events[0].stream_id
                topic_list.zoom_in()
            }else if(type=="stream"){
                if(data.events[0].streams&&data.events[0].streams.length>0&&data.events[0].op=="delete"){
                    var arr = JSON.parse(localStorage.getItem("arr"))
                    for(var i=0;i<arr.length;i++){
                        if(arr[i].stream_id == data.events[0].streams[0].stream_id){
                            $(".notice_bottom[name="+arr[i].stream_id+"]").html("该群组已经解散....")
                            arr.remove(i)
                        }
                    }
                    localStorage.setItem("arr",JSON.stringify(arr))
                    var name = data.events[0].streams[0].name
                    server_events.showNotify("删除群聊","删除群聊"+name)
                    $(window).attr("location","#narrow/is/starred")
                }
            }
            var  type;
            var  data_message;
            // $.ajax({
            //     url:"json/zg/user",
            //     type:"GET",
            //     success:function(res){
                    var user_list = JSON.parse(localStorage.getItem("user_list"))
                    var user_me = localStorage.getItem("myFullName")
                    // var user_id = res.user_id
                    for(var i = 0;i<data.events.length;i++){
                        type = data.events[0].type
                        if(type == "message"){
                            data_message = data.events[0].message
                        }
                    }
                    if(type == "message" && data_message!=undefined){
                        var send_id = data_message.sender_id
                        var name = data_message.sender_full_name
                        var mes = server_events.deleteTag(data_message.content)
                        var avatar = server_events.get_my_avater(send_id,user_list)
                        var time = data_message.timestamp
                        var stream_id = data_message.stream_id
                        var short_name = data_message.sender_short_name
                        // var _href = data_message.pm_with_url
                        var _href = "#narrow/pm-with/"+send_id+"-"+short_name
                        var sub;
                        var recipient = data_message.display_recipient[0].id;
                        var r_name = data_message.display_recipient[0].full_name;
                        var stream_name;
                        if(stream_id){
                          sub  = stream_data.get_sub_by_id(stream_id)
                        }
                        arr = JSON.parse(localStorage.getItem("arr"))
                        if(arr == null){
                            arr = []
                            if(data_message.type==="private"){
                                var time_stamp = new Date().getTime()
                                arr.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,stream,short_name,time_stamp))
                                var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                $(".persistent_data").prepend(notice_box)
                                unread_ui.update_unread_counts()
                                server_events.sortBytime()
                            }else if(data_message.type==="stream"){
                                var avatar = sub.color
                                var name = sub.name
                                var stream = data_message.type
                                var _href= narrow.by_stream_subject_uris(name,data_message.subject)
                                arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream,short_name,time_stamp))
                                var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,stream_id:stream_id,time:time,_href:_href,stream:stream})
                                $(".persistent_data").prepend(notice_box)
                                $(".notice_ctn[stream_id="+stream_id+"]").addClass("backgr").parent().siblings().children().removeClass("backgr")
                            }
                            localStorage.setItem("arr",JSON.stringify(arr))
                        }else{
                            var flag = false;
                            for(var j =0 ;j<arr.length;j++){
                                if(user_me!=name&&data_message.type==="private"){
                                    if(arr[j].send_id == send_id){
                                        flag = true;
                                        $(".notice_bottom[name='"+send_id+"']").html(mes)
                                        $(".notice_top_time[name='"+send_id+"']").html(server_events.tf(time))
                                        $(".only_tip[send_id="+send_id+"]").attr("time_stamp",time*1000)
                                        arr[j].content = mes
                                        arr[j].time= server_events.tf(time)
                                        arr[j].time_stamp = time*1000
                                        var sarr = arr.splice(j,1)
                                        arr.unshift(sarr[0])
                                        localStorage.setItem("arr",JSON.stringify(arr))
                                        server_events.sortBytime()
                                    }
                                }
                                
                                if(user_me == name&&arr[j].name==r_name&&arr[j].stream==""&&data_message.type==="private"){
                                    $(".notice_bottom[name="+recipient+"]").html(mes)
                                    $(".notice_top_time[name="+recipient+"]").html(server_events.tf(time))
                                    $(".only_tip[send_id="+recipient+"]").attr("time_stamp",time*1000)
                                    arr[j].content = mes
                                    arr[j].time= server_events.tf(time)
                                    arr[j].time_stamp = time*1000
                                    var sarr = arr.splice(j,1)
                                    arr.unshift(sarr[0])
                                    // console.log(time*1000)
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                    server_events.sortBytime()
                                }
                                if(arr[j].stream_id==stream_id&&arr[j].name==sub.name&&data_message.type==="stream"){
                                    if(user_me!=name){
                                        flag=true
                                        $(".notice_bottom[name="+stream_id+"]").html(mes)
                                        $(".notice_top_time[name="+stream_id+"]").html(server_events.tf(time))
                                        var stream_li = $(".only_tip[stream_id="+stream_id+"]").parent()
                                        stream_li.remove()
                                        $(".persistent_data").prepend(stream_li)
                                        arr[j].content = mes
                                        arr[j].time= server_events.tf(time)
                                        arr[j].time_stamp = time*1000
                                        var sarr = arr.splice(j,1)
                                        arr.unshift(sarr[0])
                                        var count = unread.num_unread_for_stream(stream_id);
                                        // console.log(count)
                                        var lis = $(".only_tip[stream_id="+stream_id+"]").parent()
                                        stream_list.update_count_in_dom(lis, count);
                                       
                                        // console.log(1)
                                        localStorage.setItem("arr",JSON.stringify(arr))
                                    }else{
                                        $(".notice_bottom[name="+stream_id+"]").html(mes)
                                        $(".notice_top_time[name="+stream_id+"]").html(server_events.tf(time))
                                        var stream_li = $(".only_tip[stream_id="+stream_id+"]").parent()
                                        stream_li.remove()
                                        $(".persistent_data").prepend(stream_li)
                                        arr[j].content = mes
                                        arr[j].time= server_events.tf(time)
                                        arr[j].time_stamp = time*1000
                                        var sarr = arr.splice(j,1)
                                        arr.unshift(sarr[0])
                                        var count = unread.num_unread_for_stream(stream_id);
                                        // console.log("hahhah")
                                        var lis = $(".only_tip[stream_id="+stream_id+"]").parent()
                                        stream_list.update_count_in_dom(lis, count);
                                        $(".notice_ctn[stream_id="+stream_id+"]").addClass("backgr").parent().siblings().children().removeClass("backgr")
                                        localStorage.setItem("arr",JSON.stringify(arr))
                                    }
                                }
                            }
                            if(!flag){
                                if(user_me!=name){
                                    if(data_message.type==="private"){
                                        var time_stamp = new Date().getTime()
                                        arr.unshift(server_events.set_local_news(send_id,'',name,avatar,time,mes,_href,time_stamp))
                                        var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,send_id:send_id,time:time,short_name:short_name,_href:_href,time_stamp:time_stamp})
                                        unread_ui.update_unread_counts()
                                        console.log(11111)
                                        $(".persistent_data").prepend(notice_box)
                                        server_events.sortBytime()
                                    }else if(data_message.type==="stream"){
                                        var time_stamp = new Date().getTime()
                                        var avatar = sub.color
                                        var name = sub.name
                                        var stream = data_message.type
                                        console.log(stream_id)
                                        var _href= narrow.by_stream_subject_uris(name,data_message.subject)
                                        arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream))
                                        var notice_box = templates.render("notice_box",{name:name,mes:mes,avatar:avatar,stream_id:stream_id,time:time,_href:_href,stream:stream,time_stamp:time_stamp})
                                        $(".notice_ctn[stream_id="+stream_id+"]").addClass("backgr").parent().siblings().children().removeClass("backgr")
                                        $(".persistent_data").prepend(notice_box)
                                    }
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                }
                            }
                        }
                    }
            //     }
            // })
                exports.suspect_offline = false;
                try {
                    get_events_xhr = undefined;
                    get_events_failures = 0;
                    ui_report.hide_error($("#connection-error"));
                    get_events_success(data.events);
                } catch (ex) {
                    blueslip.error('Failed to handle get_events success\n' +
                        blueslip.exception_msg(ex),
                        undefined,
                        ex.stack);
                }
                get_events_timeout = setTimeout(get_events, 0);
            },
            error: function (xhr, error_type) {
                try {
                    get_events_xhr = undefined;
                    // If we're old enough that our message queue has been
                    // garbage collected, immediately reload.
                    if ((xhr.status === 400) &&
                        (JSON.parse(xhr.responseText).code === 'BAD_EVENT_QUEUE_ID')) {
                        page_params.event_queue_expired = true;
                        reload.initiate({
                            immediate: true,
                            save_pointer: false,
                            save_narrow: true,
                            save_compose: true
                        });
                    }

                    if (error_type === 'abort') {
                        // Don't restart if we explicitly aborted
                        return;
                    } else if (error_type === 'timeout') {
                        // Retry indefinitely on timeout.
                        get_events_failures = 0;
                        ui_report.hide_error($("#connection-error"));
                    } else {
                        get_events_failures += 1;
                    }

                    if (get_events_failures >= 5) {
                        ui_report.show_error($("#connection-error"));
                    } else {
                        ui_report.hide_error($("#connection-error"));
                    }
                } catch (ex) {
                    blueslip.error('Failed to handle get_events error\n' +
                        blueslip.exception_msg(ex),
                        undefined,
                        ex.stack);
                }
                var retry_sec = Math.min(90, Math.exp(get_events_failures / 2));
                get_events_timeout = setTimeout(get_events, retry_sec * 1000);
            },
        });
    }

    exports.assert_get_events_running = function assert_get_events_running(error_message) {
        if (get_events_xhr === undefined && get_events_timeout === undefined) {
            exports.restart_get_events({
                dont_block: true
            });
            blueslip.error(error_message);
        }
    };

    exports.restart_get_events = function restart_get_events(options) {
        get_events(options);
    };

    exports.force_get_events = function force_get_events() {
        get_events_timeout = setTimeout(get_events, 0);
    };

    exports.home_view_loaded = function home_view_loaded() {
        waiting_on_homeview_load = false;
        get_events_success([]);
        $(document).trigger("home_view_loaded.zulip");
    };


    var watchdog_time = $.now();
    exports.check_for_unsuspend = function () {
        var new_time = $.now();
        if ((new_time - watchdog_time) > 20000) { // 20 seconds.
            // Defensively reset watchdog_time here in case there's an
            // exception in one of the event handlers
            watchdog_time = new_time;
            // Our app's JS wasn't running, which probably means the machine was
            // asleep.
            $(document).trigger($.Event('unsuspend'));
        }
        watchdog_time = new_time;
    };
    setInterval(exports.check_for_unsuspend, 5000);

    exports.initialize = function () {
        $(document).on('unsuspend', function () {
            // Immediately poll for new events on unsuspend
            blueslip.log("Restarting get_events due to unsuspend");
            get_events_failures = 0;
            exports.restart_get_events({
                dont_block: true
            });
        });
        get_events();
    };

    exports.cleanup_event_queue = function cleanup_event_queue() {
        // Submit a request to the server to cleanup our event queue
        if (page_params.event_queue_expired === true) {
            return;
        }
        blueslip.log("Cleaning up our event queue");
        // Set expired because in a reload we may be called twice.
        page_params.event_queue_expired = true;
        channel.del({
            url: '/json/events',
            data: {
                queue_id: page_params.queue_id
            },
        });
    };
    //自定义推送
    exports.showNotify =function (title,msg){
        var index = msg.indexOf("的")
        var name = msg.slice(0,index)
       if(page_params.full_name===name){
           return
       } 
        var Notification = window.Notification || window.mozNotification || window.webkitNotification;
        if(Notification){
            Notification.requestPermission(function(status){
                if(status != "granted"){
                    return;
                }else{
                    var tag = "sds"+Math.random();
                    Notification.body=msg;
                    //notifyObj属于Notification构造方法的实例对象
                    var notifyObj = new Notification(
                        title,
                        {
                            dir:'auto',
                            lang:'zh-CN',
                            tag:tag,//实例化的notification的id
                            icon:'images/img/u02.png',	//icon的值显示通知图片的URL
                            body:msg
                        }
                    );
                    notifyObj.onclick=function(){
                        //如果通知消息被点击,通知窗口将被激活
                        window.focus();
                    },
                    notifyObj.onerror = function () {
                    };
                    notifyObj.onshow = function () {
                        setTimeout(function(){
                            notifyObj.close();
                        },3000)
                    };
                    notifyObj.onclose = function () {
                    };
                }
            });
        }else{
        }
    };
    window.addEventListener("beforeunload", function () {
        exports.cleanup_event_queue();
    });

    // For unit testing
    exports._get_events_success = get_events_success;

    return exports;

}());
if (typeof module !== 'undefined') {
    module.exports = server_events;
}
