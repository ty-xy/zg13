var message_fetch = (function () {

var exports = {};

var consts = {
    backfill_idle_time: 10*1000,
    error_retry_time: 5000,
    backfill_batch_size: 1000,
    narrow_before: 50,
    narrow_after: 50,
    num_before_pointer: 200,
    num_after_pointer: 200,
    backward_batch_size: 100,
    forward_batch_size: 100,
    catch_up_batch_size: 1000,
};

function process_result(data, opts) {
    var messages = data.messages;
    if(opts.msg_list.filter._operators[0].operand=== "management"){
        opts.msg_list._items=[]
        opts.msg_list._hash=[]
        opts.msg_list._all_items=[]
        opts.msg_list.view.message_containers={}
        opts.msg_list.view._message_groups=[]
        opts.msg_list.view._rows=[]
        opts.msg_list._selected_id= -1
    }
    $('#connection-error').removeClass("show");
    if ((messages.length === 0) && (current_msg_list === message_list.narrowed)&&message_list.narrowed.empty()) {
        // if(message_list.narrowed.empty()){
        //     $("#zfilt").show();
        //     narrow.show_empty_narrow_message();
        // }else{
        //     $("#zfilt").hide();
        //     narrow.show_empty_narrow_message();
        // }
        // &&message_list.narrowed.empty()
        // Even after trying to load more messages, we have no
        // messages to display in this narrow.
        // console.log("heha")
        // $("#zfilt").hide();
        narrow.show_empty_narrow_message();
    }

    _.each(messages, message_store.set_message_booleans);
    messages = _.map(messages, message_store.add_message_metadata);

    // In case any of the newly fetched messages are new, add them to
    // our unread data structures.  It's important that this run even
    // when fetching in a narrow, since we might return unread
    // messages that aren't in the home view data set (e.g. on a muted
    // stream).
    message_util.do_unread_count_updates(messages);

    // If we're loading more messages into the home view, save them to
    // the message_list.all as well, as the home_msg_list is reconstructed
    // from message_list.all.
    if (opts.msg_list === home_msg_list) {
        message_util.add_messages(messages, message_list.all, {messages_are_new: false});
    }

    if (messages.length !== 0) {
        message_util.add_messages(messages, opts.msg_list, {messages_are_new: false});
    }

    activity.process_loaded_messages(messages);
    stream_list.update_streams_sidebar();
    pm_list.update_private_messages();

    if (opts.cont !== undefined) {
        opts.cont(data);
    }
}

function get_messages_success(data, opts) {
    if (opts.msg_list.narrowed && opts.msg_list !== current_msg_list) {
        // We unnarrowed before receiving new messages so
        // don't bother processing the newly arrived messages.
        return;
    }
    if (! data) {
        // The server occasionally returns no data during a
        // restart.  Ignore those responses and try again
        setTimeout(function () {
            exports.load_messages(opts);
        }, 0);
        return;
    }

    process_result(data, opts);
    resize.resize_bottom_whitespace();
}


exports.load_messages = function (opts) {
    var data = {anchor: opts.anchor,
                num_before: opts.num_before,
                num_after: opts.num_after};

    if (opts.msg_list.narrowed && narrow_state.active()) {
        var operators = narrow_state.public_operators();
        if (page_params.narrow !== undefined) {
            operators = operators.concat(page_params.narrow);
        }
        data.narrow = JSON.stringify(operators);
    }
    if (opts.msg_list === home_msg_list && page_params.narrow_stream !== undefined) {
        data.narrow = JSON.stringify(page_params.narrow);
    }
    if (opts.use_first_unread_anchor) {
        data.use_first_unread_anchor = true;
    }

    data.client_gravatar = true;

    channel.get({
        url:      '/json/messages',
        data:     data,
        idempotent: true,
        success: function (data) {
            get_messages_success(data, opts);
            if(data.result == "success"){
            $.ajax({
                type:"GET",
                url:"json/zg/backlog",
                success:function(res){
                    if(res.errno == 0){
                        $(".todo_box").children().remove();
                        for(var key in res.backlog_list){
                            $(".todo_box").append("<li class='todo'>\
                            <div class='todo_left'>\
                                    <input type='checkbox' class='add_checkbox' inputid = "+res.backlog_list[key].id+" state = "+res.backlog_list[key].state+">\
                                    <p class='add_ctn' over_time="+res.backlog_list[key].over_time+" task="+res.backlog_list[key].task+" taskid="+ res.backlog_list[key].id +" taskdetails="+res.backlog_list[key].task_details+">"+res.backlog_list[key].task+"</p>\
                            </div>\
                            <div class='todo_right'>\
                                    <i class='iconfont icon-beizhu note_icon'></i>\
                                    <i class='iconfont icon-fujian1 attachment_icon'></i>\
                                    <p class='add_datatime'>"+res.backlog_list[key].over_time+"</p>\
                            </div>\
                        </li>")
                        }
                        var backlog_id;
                        $(".add_ctn").on("click",function(e){
                            $(".taskdetail_md").show();
                            $(".app").css("overflow-y","hidden");
                            $(".taskdetail_list").html($(this).html());
                            $(".taskdetail_md").remove();
                            var taskid = Number($(this).attr("taskid"))
                            backlog_id = taskid;
                            console.log(backlog_id)
                            var backlogs_id = backlog_id;
                            var obj = {
                                "backlogs_id":backlog_id
                            }
                            $.ajax({
                                type:"GET",
                                url:"json/zg/backlogs/details",
                                contentType:"application/json",
                                data:obj,
                                success:function(res){
                                    function timestampToTime(timestamp) {
                                        var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
                                        Y = date.getFullYear() + '-';
                                        M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
                                        D = date.getDate() + ' ';
                                        h = date.getHours() + ':';
                                        m = date.getMinutes() + ':';
                                        s = date.getSeconds();
                                        return Y+M+D+h+m+s;
                                    }
                                    var taskdetail_list = res.backlogs_dict.task;
                                    var taskdetail_addnote = res.backlogs_dict.task_details;
                                    var create_time = timestampToTime(res.backlogs_dict.create_time).substring(0,10);
                                    var over_time = timestampToTime(res.backlogs_dict.over_time).substring(0,10);
                                    var state = res.backlogs_dict.state;
                                    var html = templates.render("taskdetail_md",{
                                        taskdetail_list:taskdetail_list,
                                        taskdetail_addnote:taskdetail_addnote,
                                        create_time:create_time,
                                        over_time:over_time,
                                        state:state
                                    })
                                    $(".app").after(html)
                                    $(".taskdetail_md").show();
                                    // $.ajax({
                                    //     type:"PUT",
                                    //     url:"zg/api/v1/backlog",
                                    //     contentType:"application/json",
                                    //     data:obj_backlog_change,
                                    //     success:function(res){
                                    //         _this.parent().parent().remove();
                                    //         $(".completed_box").prepend(_this.parent().parent());
                                    //         // 临时方案
                                    //         location.reload();
                                    //         // 临时方案
                                    //         //zyc添加
                                    //     }
                                    // })
                            //点击任务详情模版关闭任务详情
                            $(".taskdetail_md").on("click",function(e){
                                e.stopPropagation();
                                e.preventDefault();
                                $(".taskdetail_md").hide();
                                $(".app").css("overflow-y","scroll");
                            })
                            
                            //任务详情上的内容点击生效
                            $(".taskdetail_box").on("click",function(e){
                                e.stopPropagation();
                                // e.preventDefault();
                            })
                            //任务详情点击关闭
                            $(".taskdetail_close").on("click",function(e){
                                $(".taskdetail_md").hide();
                                $(".app").css("overflow-y","scroll")
                            })
                            //任务详情弹窗内的文件展示 划入事件
                            $(".taskdetail_attachment").on("mousemove",function(e){
                                $(this).css("border","1px solid #A0ACBF")
                                $(this).children().last().show();
                            })
                            //任务详情弹窗内的文件展示 划出事件
                            $(".taskdetail_attachment").on("mouseleave",function(e){
                                $(this).css("border","1px solid #fff")
                                $(this).children().last().hide();
                            })
                            $(".taskdetail_selectionbtn").on("click",function(e){
                                // $(".taskdetail_selectionbtn").append()
                            })
                            $(".taskdetail_tips_confirm").on("click",function(e){
                                var _obj_backlog_id = {
                                    "backlog_id":backlog_id
                                }
                                var obj_backlog_id = JSON.stringify(_obj_backlog_id)
                                $.ajax({
                                    type:"DELETE",
                                    url:"zg/api/v1/backlog",
                                    contentType:"application/json",
                                    data:obj_backlog_id,
                                    success:function(r){
        
                                    }
                                })
                                $("p[taskid='"+backlog_id+"']").parent().parent().remove();
                                $(".taskdetail_tips_box").hide();
                                $(".taskdetail_md").hide();
                                $(".app").css("overflow-y","scroll");
                            })
                            //关闭操作提示
                            $(".taskdetail_tips_close").on("click",function(e){
                                $(".taskdetail_tips_box").hide();
                            })
                            //点击删除字样弹窗
                            $(".taskdetail_deleteone").on("click",function(e){
                                $(".taskdetail_tips_box").show();
                            })
                            //点击取消去除提示框
                            $(".taskdetail_tips_cancel").on("click",function(e){
                                $(".taskdetail_tips_box").hide();
                            })
                            //初始化 任务详情任务开始日历
                            $('#taskstart_datetimepicker').datetimepicker({  
                                language:"zh-CN",  
                                todayHighlight: true,  
                                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                                weekStart:1  
                            });  
                            //初始化 任务详情截止日历
                            $('#taskstop_datetimepicker').datetimepicker({  
                                language:"zh-CN",  
                                todayHighlight: true,  
                                minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                                weekStart:1  
                            }); 
                                }
                            })
                            
                            

                             
                            // var taskdetails = $(this).attr("taskdetails");
                            // var over_time = $(this).attr("over_time");
                            // var task = $(this).attr("task");
                            // console.log(taskdetails)
                            // $("#taskdetail_addnote").text(taskdetails);
                            // $("#taskdetail_addnote").attr("placeholder",'nidbaisbdaubsd')
                            
                            
                        })
                        
                        $(".add_checkbox").on("click",function(e){
                            var inputid = Number($(this).attr("inputid"))
                            var state = ($(this).attr("state"))
                            if($(this).is(":checked")){
                                var _this = $(this);
                                state = ($(this).attr("state"))
                                state = 0;
                                var backlog_change = {
                                    state:0,
                                    backlogs_id:inputid
                                }
                                var obj_backlog_change = JSON.stringify(backlog_change);
                                $.ajax({
                                    type:"PUT",
                                    url:"zg/api/v1/backlog",
                                    contentType:"application/json",
                                    data:obj_backlog_change,
                                    success:function(res){
                                        _this.parent().parent().remove();
                                        $(".completed_box").prepend(_this.parent().parent());
                                    }
                                })
                            }else{
                                
                            }
                        })
                        
                        $.ajax({
                            type:"GET",
                            url:"json/zg/backlogss/accomplis",
                            data:{page:1},
                            success:function(rescompleted){
                                if(rescompleted.errno == 0){
                                    $(".completed_box").children().remove();
                                    for(var key in rescompleted.accomplis_backlogs_list){
                                        $(".completed_box").append("<li class='completed'>\
                                        <div>\
                                        <input type='checkbox' class='completed_checkbox checked' checked='checked' inputid="+ rescompleted.accomplis_backlogs_list[key].id +">\
                                        <p class='completed_ctn' taskid="+ rescompleted.accomplis_backlogs_list[key].id +">"+rescompleted.accomplis_backlogs_list[key].task+"</p>\
                                        </div>\
                                </li>")
                                    }
                                    $(".completed_ctn").on("click",function(e){
                                        $(".taskdetail_md").show();
                                        $(".app").css("overflow-y","hidden");
                                        $(".taskdetail_list").html($(this).html());
                                        var taskid = Number($(this).attr("taskid"))
                                        backlog_id = taskid;
                                    })

                                    $(".completed_checkbox").on("click",function(e){
                                        var inputid = Number($(this).attr("inputid"))
                                        var state = ($(this).attr("state"))
                                        if(!$(this).is(":checked")){
                                            var _this = $(this);
                                            state = ($(this).attr("state"))
                                            state = 2;
                                            var backlog_change = {
                                                state:2,
                                                backlogs_id:inputid
                                            }
                                            var obj_backlog_change = JSON.stringify(backlog_change);
                                            $.ajax({
                                                type:"PUT",
                                                url:"zg/api/v1/backlog",
                                                contentType:"application/json",
                                                data:obj_backlog_change,
                                                success:function(res){
                                                    _this.parent().parent().remove();
                                                    $(".todo_box").prepend(_this.parent().parent());
                                                    // 临时方案
                                                    location.reload();
                                                    // 临时方案
                                                }
                                            })
                                        }else{
                                            
                                        }
                                    })
                                }
                                
                            }
                        })
                    }
                },
                error:function(rej){
                    console.log(rej)
                }   
            })
        }
        },
        error: function (xhr) {
            if (opts.msg_list.narrowed && opts.msg_list !== current_msg_list) {
                // We unnarrowed before getting an error so don't
                // bother trying again or doing further processing.
                return;
            }
            if (xhr.status === 400) {
                // Bad request: We probably specified a narrow operator
                // for a nonexistent stream or something.  We shouldn't
                // retry or display a connection error.
                //
                // FIXME: Warn the user when this has happened?
                var data = {
                    messages: [],
                };
                process_result(data, opts);
                return;
            }

            // We might want to be more clever here
            $('#connection-error').addClass("show");
            setTimeout(function () {
                exports.load_messages(opts);
            }, consts.error_retry_time);
        },
    });
};

exports.load_messages_for_narrow = function (opts) {
    var msg_list = message_list.narrowed;

    msg_list.fetch_status.start_initial_narrow();

    message_fetch.load_messages({
        anchor: opts.then_select_id.toFixed(),
        num_before: consts.narrow_before,
        num_after: consts.narrow_after,
        msg_list: msg_list,
        use_first_unread_anchor: opts.use_initial_narrow_pointer,
        cont: function (data) {
            msg_list.fetch_status.finish_initial_narrow({
                found_oldest: data.found_oldest,
                found_newest: data.found_newest,
            });
            message_scroll.hide_indicators();
            opts.cont();
        },
    });
};

exports.get_backfill_anchor = function (msg_list) {
    var oldest_message_id;

    if (msg_list === home_msg_list) {
        msg_list = message_list.all;
    }

    if (msg_list.first() === undefined) {
        oldest_message_id = page_params.pointer;
    } else {
        oldest_message_id = msg_list.first().id;
    }
    return oldest_message_id;
};

exports.get_frontfill_anchor = function (msg_list) {
    if (msg_list === home_msg_list) {
        msg_list = message_list.all;
    }

    var last_msg = msg_list.last();

    if (last_msg) {
        return last_msg.id;
    }

    return page_params.pointer;
};

exports.maybe_load_older_messages = function (opts) {
    // This function gets called when you scroll to the top
    // of your window, and you want to get messages older
    // than what the browers originally fetched.
    var msg_list = opts.msg_list;
    if (!msg_list.fetch_status.can_load_older_messages()) {
        // We may already be loading old messages or already
        // got the oldest one.
        return;
    }

    opts.show_loading();
    exports.do_backfill({
        msg_list: msg_list,
        num_before: consts.backward_batch_size,
        cont: function () {
            opts.hide_loading();
        },
    });
};

exports.do_backfill = function (opts) {
    var msg_list = opts.msg_list;

    msg_list.fetch_status.start_older_batch();
    if (msg_list === home_msg_list) {
        message_list.all.fetch_status.start_older_batch();
    }

    var anchor = exports.get_backfill_anchor(msg_list).toFixed();

    exports.load_messages({
        anchor: anchor,
        num_before: opts.num_before,
        num_after: 0,
        msg_list: msg_list,
        cont: function (data) {
            msg_list.fetch_status.finish_older_batch({
                found_oldest: data.found_oldest,
            });
            if (msg_list === home_msg_list) {
                message_list.all.fetch_status.finish_older_batch({
                    found_oldest: data.found_oldest,
                });
            }
            if (opts.cont) {
                opts.cont();
            }
        },
    });
};

exports.maybe_load_newer_messages = function (opts) {
    // This function gets called when you scroll to the top
    // of your window, and you want to get messages newer
    // than what the browers originally fetched.
    var msg_list = opts.msg_list;

    if (!msg_list.fetch_status.can_load_newer_messages()) {
        // We may already be loading new messages or already
        // got the newest one.
        return;
    }

    msg_list.fetch_status.start_newer_batch();
    if (msg_list === home_msg_list) {
        message_list.all.fetch_status.start_newer_batch();
    }

    var anchor = exports.get_frontfill_anchor(msg_list).toFixed();

    exports.load_messages({
        anchor: anchor,
        num_before: 0,
        num_after: consts.forward_batch_size,
        msg_list: msg_list,
        cont: function (data) {
            msg_list.fetch_status.finish_newer_batch({
                found_newest: data.found_newest,
            });
            if (msg_list === home_msg_list) {
                message_list.all.fetch_status.finish_newer_batch({
                    found_newest: data.found_newest,
                });
            }
        },
    });
};

exports.start_backfilling_messages = function () {
    // backfill more messages after the user is idle
    $(document).idle({idle: consts.backfill_idle_time,
                      onIdle: function () {
                          exports.do_backfill({
                              num_before: consts.backfill_batch_size,
                              msg_list: home_msg_list,
                          });
                      }});
};

exports.initialize = function () {
    // get the initial message list
    function load_more(data) {
        // If we received the initially selected message, select it on the client side,
        // but not if the user has already selected another one during load.
        //
        // We fall back to the closest selected id, as the user may have removed
        // a stream from the home before already
        if (home_msg_list.selected_id() === -1 && !home_msg_list.empty()) {
            home_msg_list.select_id(page_params.pointer,
                                    {then_scroll: true, use_closest: true,
                                     target_scroll_offset: page_params.initial_offset});
        }

        home_msg_list.fetch_status.finish_newer_batch({
            found_newest: data.found_newest,
        });

        message_list.all.fetch_status.finish_newer_batch({
            found_newest: data.found_newest,
        });

        if (data.found_newest) {
            server_events.home_view_loaded();
            exports.start_backfilling_messages();
            return;
        }

        // If we fall through here, we need to keep fetching more data, and
        // we'll call back to the function we're in.
        var messages = data.messages;
        var latest_id = messages[messages.length-1].id;

        exports.load_messages({
            anchor: latest_id.toFixed(),
            num_before: 0,
            num_after: consts.catch_up_batch_size,
            msg_list: home_msg_list,
            cont: load_more,
        });

    }

    if (page_params.have_initial_messages) {
        home_msg_list.fetch_status.start_newer_batch();
        message_list.all.fetch_status.start_newer_batch();
        exports.load_messages({
            anchor: page_params.pointer,
            num_before: consts.num_before_pointer,
            num_after: consts.num_after_pointer,
            msg_list: home_msg_list,
            cont: load_more,
        });
    } else {
        server_events.home_view_loaded();
    }
};

return exports;

}());
if (typeof module !== 'undefined') {
    module.exports = message_fetch;
}
