var click_handlers = (function () {

// We don't actually export anything yet; this is just for consistency.
var exports = {};

// You won't find every click handler here, but it's a good place to start!

$(function () {

    // MOUSE MOVING VS DRAGGING FOR SELECTION DATA TRACKING

    var drag = (function () {
        var start;
        var time;

        return {
            start: function (e) {
                start = { x: e.offsetX, y: e.offsetY };
                time = new Date().getTime();
            },

            end: function (e) {
                var end = { x: e.offsetX, y: e.offsetY };

                var dist;
                if (start) {
                    // get the linear difference between two coordinates on the screen.
                    dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                } else {
                    // this usually happens if someone started dragging from outside of
                    // a message and finishes their drag inside the message. The intent
                    // in that case is clearly to select an area, not click a message;
                    // setting dist to Infinity here will ensure that.
                    dist = Infinity;
                }

                this.val = dist;
                this.time = new Date().getTime() - time;

                start = undefined;

                return dist;
            },
            val: null,
        };
    }());

    $("#main_div").on("mousedown", ".messagebox", function (e) {
        drag.start(e);
    });
    $("#main_div").on("mouseup", ".messagebox", function (e) {
        drag.end(e);
    });

    // MESSAGE CLICKING

    function is_clickable_message_element(target) {
        return target.is("a") || target.is("img.message_inline_image") || target.is("img.twitter-avatar") ||
            target.is("div.message_length_controller") || target.is("textarea") || target.is("input") ||
            target.is("i.edit_content_button") ||
            (target.is(".highlight") && target.parent().is("a"));
    }

    function initialize_long_tap() {
        var MS_DELAY = 750;
        var meta = {
            touchdown: false,
        };

        $("#main_div").on("touchstart", ".messagebox", function () {
            meta.touchdown = true;
            meta.invalid = false;

            setTimeout(function () {
                if (meta.touchdown === true && !meta.invalid) {
                    $(this).trigger("longtap");
                }
            }.bind(this), MS_DELAY);
        });

        $("#main_div").on("touchend", ".messagebox", function () {
            meta.touchdown = false;
        });

        $("#main_div").on("touchmove", ".messagebox", function () {
            meta.invalid = true;
        });

        $("#main_div").on("contextmenu", ".messagebox", function (e) {
            e.preventDefault();
        });
    }

    // this initializes the trigger that will give off the longtap event, which
    // there is no point in running if we are on desktop since this isn't a
    // standard event that we would want to support.
    if (util.is_mobile()) {
        initialize_long_tap();
    }

    var select_message_function = function (e) {

            //公共聊天信息显隐处理
            $(".our_news_box p").off('mouseover').on('mouseover',function(){
                $(this).parent().next().show()
            })
            $(".additional_more_box").on("click",function(){
                $(this).children().last().show();
            })
            $(".other_content").off('mouseleave').on('mouseleave',function(){
                $(this).children().last().hide()
                $(this).children().last().children().children().last().hide();
            })
            $(".my_bubble").off('mouseleave').on('mouseleave',function(){
                $(this).children().last().hide()
                $(this).children().last().children().first().children().last().hide();
            })
            //转为待办
            $(".additional_box").off("click").on("click",".additional_todo",function(){
                $(".transfer_md").remove();
                var task_title = $(this).parent().parent().parent().prev().children().eq(1).text().trim()
                var transfer_todo =templates.render(("transfer_todo"),{task_title:task_title})
                $(".app").append(transfer_todo)
                //初始化 转为待办 结束时间日历
                $('#transfer_datetimepicker').datetimepicker({  
                    language:"zh-CN",  
                    todayHighlight: true,  
                    minView:2,//最精准的时间选择为日期0-分 1-时 2-日 3-月  
                    weekStart:1  
                }); 

            })
            //可点击模版s
            $(".transfer_box").on("click",function(e){
                e.stopPropagation();
            })
            //点击关闭
            $(".transfer_md").on("click",function(){
                $(".transfer_md").hide();
            })
            $(".transfer_box_close").on("click",function(){
                $(".transfer_md").hide();
            })
            //取消
            $(".transfer_btn_cancel").on("click",function(){
                // $(".transfer_content").val("")
                // $("#transfer_input").val("")
                $(".transfer_md").hide();
            })
            //完成并关闭
            $(".transfer_btn_close").on("click",function(){
                var task = $(".transfer_content").val()
                var over_time = $("#transfer_input").val()
                if(task==""){
                    $(".transfer_content").css("border","1px solid #EF5350");
                    return;
                }
                if(task!=""){
                    $(".transfer_content").css("border","1px solid #ccc");
                }
                if(over_time==""){
                    $("#transfer_input").css("border","1px solid #EF5350");
                    $("#transfer_input").css("border-right","none");
                    $("#transferdata").css("border","1px solid #EF5350")
                    return;
                }
                if(over_time!=""){
                    $("#transfer_input").css("border","none");
                    $("#transferdata").css("border","1px solid #ccc")
                }
                var obj = {
                    task:task,
                    over_time:management.toTimestamp(over_time)+86399
                }
                $.ajax({
                    type:"POST",
                    contentType:"application/json",
                    url:"json/zg/backlog/",
                    data:JSON.stringify(obj),
                    success:function(res){
                        if(res.errno == 0){
                            $(".transfer_md").hide();
                        }
                    }
                })
            })  
            //复制到粘贴板
            var copynum = 0;
            $(".recipient_row").off("click").on("click", '.additional_copy', function(e){
                $(this).parent().parent().parent().hide()
                var btn = $(this)[0]
                var clipboard = new ClipboardJS(btn);
                // console.log(clipboard)
                clipboard.on('success', function(e) {
                    // console.log(e); 
                    copynum++;
                    if(copynum >= 1){
                        clipboard.destroy();
                        clipboard = new ClipboardJS(btn);
                    };
                });
                clipboard.on('error', function(e) {
                    // console.log(e);
                });
            })
            $(".additional_reply").off("click").on("click",function(){
                $(this).parent().parent().parent().hide()
                compose_actions.quote_and_reply({trigger: 'popover respond'});
            })
            //收藏消息
            // $("#zfilt").off("click",".additional_collection").on("click",".additional_collection",function(){
            //     console.log(23)
            //     var id = Number($(this).parent().parent().parent().parent().parent().parent().parent().attr("zid"))
            //     flag = $(this).parent().prev().attr("star")
            //     star = $(this).parent().prev().children().first()
                
            //     var status;
            //     if(flag == "false"){
            //         status = "add"
            //         $(this).parent().prev().attr("star","true")
            //     }else{
            //         status = "remove"
            //         $(this).parent().prev().attr("star","false")
            //     }
            //     var obj = {
            //         type:"message",
            //         type_id:id,
            //         status:status
            //     }
            //     $.ajax({
            //         type:"PUT",
            //         url:"json/zg/collection/",
            //         contentType:"appliction/json",
            //         data:JSON.stringify(obj),
            //         success:function(res){
            //             if(res.message == '收藏成功'){
            //                 star.show()
            //             }else if(res.message == "取消收藏成功"){
            //                 star.hide()
            //             }
            //         }
            //     })
            // })
        if (is_clickable_message_element($(e.target))) {
            // If this click came from a hyperlink, don't trigger the
            // reply action.  The simple way of doing this is simply
            // to call e.stopPropagation() from within the link's
            // click handler.
            //
            // Unfortunately, on Firefox, this breaks Ctrl-click and
            // Shift-click, because those are (apparently) implemented
            // by adding an event listener on link clicks, and
            // stopPropagation prevents them from being called.
            return;
        }

        // A tricky issue here is distinguishing hasty clicks (where
        // the mouse might still move a few pixels between mouseup and
        // mousedown) from selecting-for-copy.  We handle this issue
        // by treating it as a click if distance is very small
        // (covering the long-click case), or fairly small and over a
        // short time (covering the hasty click case).  This seems to
        // work nearly perfectly.  Once we no longer need to support
        // older browsers, we may be able to use the window.selection
        // API instead.
        if ((drag.val < 5 && drag.time < 150) || drag.val < 2) {
            var row = $(this).closest(".message_row");
            var id = rows.id(row);

            if (message_edit.is_editing(id)) {
                // Clicks on a message being edited shouldn't trigger a reply.
                return;
            }

            current_msg_list.select_id(id);
            compose_actions.respond_to_message({trigger: 'message click'});
            e.stopPropagation();
            popovers.hide_all();
        } 
    };

    // if on normal non-mobile experience, a `click` event should run the message
    // selection function which will open the compose box  and select the message.
    if (!util.is_mobile()) {
        $("#main_div").on("click", ".messagebox", select_message_function);
    // on the other hand, on mobile it should be done with a long tap.
    } else {
        $("#main_div").on("longtap", ".messagebox", function (e) {
            // find the correct selection API for the browser.
            var sel = window.getSelection ? window.getSelection() : document.selection;
            // if one matches, remove the current selections.
            // after a longtap that is valid, there should be no text selected.
            if (sel) {
                if (sel.removeAllRanges) {
                    sel.removeAllRanges();
                } else if (sel.empty) {
                    sel.empty();
                }
            }

            select_message_function.call(this, e);
        });
    }

    $("#main_div").on("click", ".star", function (e) {
        e.stopPropagation();
        popovers.hide_all();

        var message_id = rows.id($(this).closest(".message_row"));
        var message = message_store.get(message_id);
        message_flags.toggle_starred(message);
    });

    $("#main_div").on("click", ".message_reaction", function (e) {
        e.stopPropagation();
        var local_id = $(this).attr('data-reaction-id');
        var message_id = rows.get_message_id(this);
        reactions.process_reaction_click(message_id, local_id);
    });

    $("#main_div").on("click", "a.stream", function (e) {
        e.preventDefault();
        // Note that we may have an href here, but we trust the stream id more,
        // so we re-encode the hash.
        var stream = stream_data.get_sub_by_id($(this).attr('data-stream-id'));
        if (stream) {
            window.location.href = '/#narrow/stream/' + hash_util.encode_stream_name(stream.name);
            return;
        }
        window.location.href = $(this).attr('href');
    });

    // NOTIFICATION CLICK

    $('body').on('click', '.notification', function () {
        var payload = $(this).data("narrow");
        ui_util.change_tab_to('#home');
        narrow.activate(payload.raw_operators, payload.opts_notif);
    });

    // MESSAGE EDITING

    $('body').on('click', '.edit_content_button', function (e) {
        var row = current_msg_list.get_row(rows.id($(this).closest(".message_row")));
        current_msg_list.select_id(rows.id(row));
        message_edit.start(row);
        e.stopPropagation();
        popovers.hide_all();
    });
    $('body').on('click','.always_visible_topic_edit,.on_hover_topic_edit', function (e) {
        var recipient_row = $(this).closest(".recipient_row");
        message_edit.start_topic_edit(recipient_row);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".topic_edit_save", function (e) {
        var recipient_row = $(this).closest(".recipient_row");
        message_edit.show_topic_edit_spinner(recipient_row);
        message_edit.save(recipient_row, true);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".topic_edit_cancel", function (e) {
        var recipient_row = $(this).closest(".recipient_row");
        current_msg_list.hide_edit_topic(recipient_row);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".message_edit_save", function (e) {
        var row = $(this).closest(".message_row");
        message_edit.save(row, false);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".message_edit_cancel", function (e) {
        var row = $(this).closest(".message_row");
        message_edit.end(row);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".message_edit_close", function (e) {
        var row = $(this).closest(".message_row");
        message_edit.end(row);
        e.stopPropagation();
        popovers.hide_all();
    });
    $("body").on("click", ".copy_message", function (e) {
        var row = $(this).closest(".message_row");
        message_edit.end(row);
        row.find(".alert-msg").text(i18n.t("Copied!"));
        row.find(".alert-msg").css("display", "block");
        row.find(".alert-msg").delay(1000).fadeOut(300);
        e.preventDefault();
        e.stopPropagation();
    });
    $("body").on("click", "a", function () {
        if (document.activeElement === this) {
            ui_util.blur_active_element();
        }
    });
    $('#message_edit_form .send-status-close').click(function () {
        var row_id = rows.id($(this).closest(".message_row"));
        var send_status = $('#message-edit-send-status-' + row_id);
        $(send_status).stop(true).fadeOut(200);
    });
    $("body").on("click", "#message_edit_form [id^='attach_files_']", function (e) {
        e.preventDefault();

        var row_id = rows.id($(this).closest(".message_row"));
        $("#message_edit_file_input_" + row_id).trigger("click");
    });

    // MUTING

    $('body').on('click', '.on_hover_topic_mute', function (e) {
        e.stopPropagation();
        var stream_id = $(e.currentTarget).attr('data-stream-id');
        var topic = $(e.currentTarget).attr('data-topic-name');
        var stream = stream_data.get_sub_by_id(stream_id);
        muting_ui.mute(stream.name, topic);
    });

    // RECIPIENT BARS

    function get_row_id_for_narrowing(narrow_link_elem) {
        var group = rows.get_closest_group(narrow_link_elem);
        var msg_id = rows.id_for_recipient_row(group);

        var nearest = current_msg_list.get(msg_id);
        var selected = current_msg_list.selected_message();
        if (util.same_recipient(nearest, selected)) {
            return selected.id;
        }
        return nearest.id;
    }

    $("#home").on("click", ".narrows_by_recipient", function (e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        var row_id = get_row_id_for_narrowing(this);
        narrow.by_recipient(row_id, {trigger: 'message header'});
    });

    $("#home").on("click", ".narrows_by_subject", function (e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        var row_id = get_row_id_for_narrowing(this);
        narrow.by_subject(row_id, {trigger: 'message header'});
    });

    // SIDEBARS

    $("#userlist-toggle-button").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        var sidebarHidden = !$(".app-main .column-right").hasClass("expanded");
        popovers.hide_all();
        if (sidebarHidden) {
            popovers.show_userlist_sidebar();
        }
    });

    $("#streamlist-toggle-button").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        var sidebarHidden = !$(".app-main .column-left").hasClass("expanded");
        popovers.hide_all();
        if (sidebarHidden) {
            stream_popover.show_streamlist_sidebar();
        }
    });

    $('#user_presences').expectOne().on('click', '.selectable_sidebar_block', function (e) {
        var user_id = $(e.target).parents('li').attr('data-user-id');
        var email = people.get_person_from_user_id(user_id).email;
        activity.clear_and_hide_search();
        narrow.by('pm-with', email, {select_first_unread: true, trigger: 'sidebar'});
        // The preventDefault is necessary so that clicking the
        // link doesn't jump us to the top of the page.
        e.preventDefault();
        // The stopPropagation is necessary so that we don't
        // see the following sequence of events:
        // 1. This click "opens" the composebox
        // 2. This event propagates to the body, which says "oh, hey, the
        //    composebox is open and you clicked out of it, you must want to
        //    stop composing!"
        e.stopPropagation();
        // Since we're stopping propagation we have to manually close any
        // open popovers.
        popovers.hide_all();
    });

    $('#group-pms').expectOne().on('click', '.selectable_sidebar_block', function (e) {
        var user_ids_string = $(e.target).parents('li').attr('data-user-ids');
        var emails = people.user_ids_string_to_emails_string(user_ids_string);
        narrow.by('pm-with', emails, {select_first_unread: true, trigger: 'sidebar'});
        e.preventDefault();
        e.stopPropagation();
        popovers.hide_all();
    });

    $("#subscriptions_table").on("click", ".exit, #subscription_overlay", function (e) {
        if ($(e.target).is(".exit, .exit-sign, #subscription_overlay, #subscription_overlay > .flex")) {
            subs.close();
        }
    });

    // HOME

    // Capture both the left-sidebar All Messages click and the tab breadcrumb All Messages
    $(document).on('click', ".home-link[data-name='home']", function (e) {
        ui_util.change_tab_to('#home');
        narrow.deactivate();
        search.update_button_visibility();
        // We need to maybe scroll to the selected message
        // once we have the proper viewport set up
        setTimeout(navigate.maybe_scroll_to_selected, 0);
        e.preventDefault();
    });
    // zyc添加 模拟hover效果改变图标颜色
    $('.left_tab').hover(
        function(){
            $(this).children(".left_tab_line").show()
        },
        function(){
            $(this).children(".left_tab_line").hide()
        }
    )
    // zyc添加 加载用户头像和用户名显示
    window.onload = function(){
        $(".user_profile").attr("src",page_params.avatar_url)
        $(".user_head_name").html(page_params.full_name)
    }
    $(".brand").on('click', function (e) {
        if (overlays.is_active()) {
            ui_util.change_tab_to('#home');
        } else {
            narrow.restore_home_state();
        }
        navigate.maybe_scroll_to_selected();
        e.preventDefault();
    });
    // zyc添加 点击 管理 刷新页面
    $("#management_refresh").on('click',function(e){
       
    })
    //zyc添加 out点击退出功能
    $("#out").on('click', function (e) {
        $("#settings_overlay_container").hide();
        e.preventDefault();
    });
    $("#show_setting").on('click', function (e) {
        $("#settings_overlay_container").show();
    });

    
    // MISC

    (function () {
        var sel = ["#group-pm-list", "#stream_filters", "#global_filters", "#user_presences"].join(", ");

        $(sel).on("click", "a", function () {
            this.blur();
        });
    }());

    popovers.register_click_handlers();
    emoji_picker.register_click_handlers();
    stream_popover.register_click_handlers();
    notifications.register_click_handlers();

    $('body').on('click', '.logout_button', function () {
        window.localStorage.clear()
        $('#logout_form').submit();
    });

    $('.restart_get_events_button').click(function () {
        server_events.restart_get_events({dont_block: true});
    });

    // this will hide the alerts that you click "x" on.
    $("body").on("click", ".alert .exit", function () {
        var $alert = $(this).closest(".alert");
        $alert.addClass("fade-out");
        setTimeout(function () {
            $alert.removeClass("fade-out show");
        }, 300);
    });


    // COMPOSE

    // NB: This just binds to current elements, and won't bind to elements
    // created after ready() is called.
    $('#compose-send-status .compose-send-status-close').click(
        function () { $('#compose-send-status').stop(true).fadeOut(500); }
    );
    $('#nonexistent_stream_reply_error .compose-send-status-close').click(
        function () { $('#nonexistent_stream_reply_error').stop(true).fadeOut(500); }
    );


    $('.compose_stream_button').click(function () {
        // console.log("是这吗？")
        compose_actions.start('stream', {trigger: 'new topic button'});
    });
    // $('.compose_private_button').click(function () {
    //     compose_actions.start('private');
    // });
    $('.compose_reply_button').click(function () {
        compose_actions.respond_to_message({trigger: 'reply button'});
    });

    $('.empty_feed_compose_stream').click(function (e) {
        compose_actions.start('stream', {trigger: 'empty feed message'});
        e.preventDefault();
    });
    $('.empty_feed_compose_private').click(function (e) {
        compose_actions.start('private', {trigger: 'empty feed message'});
        e.preventDefault();
    });

    $("body").on("click", "[data-overlay-trigger]", function () {
        var target = $(this).attr("data-overlay-trigger");
        info_overlay.show(target);
    });

    function handle_compose_click(e) {
        // Emoji clicks should be handled by their own click handler in emoji_picker.js
        if ($(e.target).is("#emoji_map, img.emoji, .drag")) {
            return;
        }
        // Don't let clicks in the compose area count as
        // "unfocusing" our compose -- in other words, e.g.
        // clicking "Press enter to send" should not
        // trigger the composebox-closing code above.
        // But do allow our formatting link.
        if (!$(e.target).is("a")) {
            e.stopPropagation();
        }
        // Still hide the popovers, however
        popovers.hide_all();
    }

    $("#compose_buttons").click(handle_compose_click);
    $(".compose-content").click(handle_compose_click);

    $("#compose_close").click(function () {
        compose_actions.cancel();
    });

    $("#streams_inline_cog").click(function (e) {
        e.stopPropagation();
        window.location.hash = "streams/subscribed";
    });
    // zyc添加
    $("#streams_inline_jia").click(function (e) {
        e.stopPropagation();
        window.location.hash = "streams/all";
    });
    $("#streams_filter_icon").click(function (e) {
        e.stopPropagation();
        stream_list.toggle_filter_displayed(e);
    });
    // $("#management").click(function(e){
    //     e.stopPropagation();
    //     $("#zhome").css('display',"none")
    //     var management = "<div>你好</div>"
    //     $("#home").before(management);
    // })
    //zyc添加点击更改名称后刷新页面重新获取数据
    $("#change_full_name_button").on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        // console.log("进入函数");
        location.reload();
    });
    // $("#save_useravatar").click(function(e){
    //     e.stopPropagation();
    //     console.log("进入函数体")
    //     // location.reload();
    //     console.log("方法结束")
    // })
    // FEEDBACK

    // Keep these 2 feedback bot triggers separate because they have to
    // propagate the event differently.
    $('.feedback').click(function () {
        compose_actions.start('private', {
            private_message_recipient: 'feedback@zulip.com',
            trigger: 'feedback menu item'});

    });
    $('#feedback_button').click(function (e) {
        e.stopPropagation();
        popovers.hide_all();
        compose_actions.start('private', {
            private_message_recipient: 'feedback@zulip.com',
            trigger: 'feedback button'});

    });


    // WEBATHENA

    $('body').on('click', '.webathena_login', function (e) {
        $("#zephyr-mirror-error").removeClass("show");
        var principal = ["zephyr", "zephyr"];
        WinChan.open({
            url: "https://webathena.mit.edu/#!request_ticket_v1",
            relay_url: "https://webathena.mit.edu/relay.html",
            params: {
                realm: "ATHENA.MIT.EDU",
                principal: principal,
            },
        }, function (err, r) {
            if (err) {
                blueslip.warn(err);
                return;
            }
            if (r.status !== "OK") {
                blueslip.warn(r);
                return;
            }

            channel.post({
                url:      "/accounts/webathena_kerberos_login/",
                data:     {cred: JSON.stringify(r.session)},
                success: function () {
                    $("#zephyr-mirror-error").removeClass("show");
                },
                error: function () {
                    $("#zephyr-mirror-error").addClass("show");
                },
            });
        });
        $('#settings-dropdown').dropdown("toggle");
        e.preventDefault();
        e.stopPropagation();
    });
    // End Webathena code

    (function () {
        var map = {
            ".stream-description-editable": stream_edit.change_stream_description,
            ".stream-name-editable": stream_edit.change_stream_name,
        };

        $(document).on("keydown", ".editable-section", function (e) {
            e.stopPropagation();
            // Cancel editing description if Escape key is pressed.
            if (e.which === 27) {
                $("[data-finish-editing='.stream-description-editable']").hide();
                $(this).attr("contenteditable", false);
                $(this).text($(this).attr("data-prev-text"));
                $("[data-make-editable]").html("");
            } else if (e.which === 13) {
                $(this).siblings(".checkmark").click();
            }
        });

        $(document).on("drop", ".editable-section", function () {
            return false;
        });

        $(document).on("input", ".editable-section", function () {
            // if there are any child nodes, inclusive of <br> which means you
            // have lines in your description or title, you're doing something
            // wrong.
            for (var x = 0; x < this.childNodes.length; x += 1) {
                if (this.childNodes[x].nodeType !== 3) {
                    this.innerText = this.innerText.replace(/\n/, "");
                    break;
                }
            }
        });

        $("body").on("click", "[data-make-editable]", function () {
            var selector = $(this).attr("data-make-editable");
            var edit_area = $(this).parent().find(selector);
            if (edit_area.attr("contenteditable") === "true") {
                $("[data-finish-editing='" + selector + "']").hide();
                edit_area.attr("contenteditable", false);
                edit_area.text(edit_area.attr("data-prev-text"));
                $(this).html("");
            } else {
                $("[data-finish-editing='" + selector + "']").show();

                edit_area.attr("data-prev-text", edit_area.text().trim())
                    .attr("contenteditable", true);

                ui_util.place_caret_at_end(edit_area[0]);

                $(this).html("&times;");
            }
        });

        $("body").on("click", "[data-finish-editing]", function (e) {
            var selector = $(this).attr("data-finish-editing");
            if (map[selector]) {
                map[selector](e);
                $(this).hide();
                $(this).parent().find(selector).attr("contenteditable", false);
                $("[data-make-editable='" + selector + "']").html("");
            }
        });
    }());


    // HOTSPOTS

    // open
    $('body').on('click', '.hotspot-icon', function (e) {
        // hide icon
        hotspots.close_hotspot_icon(this);

        // show popover
        var hotspot_name = $(e.target).closest('.hotspot-icon')
            .attr('id')
            .replace('hotspot_', '')
            .replace('_icon', '');
        var overlay_name = 'hotspot_' + hotspot_name + '_overlay';

        overlays.open_overlay({
            name: overlay_name,
            overlay: $('#' + overlay_name),
            on_close: function () {
                // close popover
                $(this).css({ display: 'block' });
                $(this).animate({ opacity: 1 }, {
                    duration: 300,
                });
            }.bind(this),
        });

        e.preventDefault();
        e.stopPropagation();
    });

    // confirm
    $('body').on('click', '.hotspot.overlay .hotspot-confirm', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var overlay_name = $(this).closest('.hotspot.overlay').attr('id');

        var hotspot_name = overlay_name
            .replace('hotspot_', '')
            .replace('_overlay', '');

        // Comment below to disable marking hotspots as read in production
        hotspots.post_hotspot_as_read(hotspot_name);
        overlays.close_overlay(overlay_name);
        $('#hotspot_' + hotspot_name + '_icon').remove();
    });

    // stop propagation
    $('body').on('click', '.hotspot.overlay .hotspot-popover', function (e) {
        e.stopPropagation();
    });


    // MAIN CLICK HANDLER

    $(document).on('click', function (e) {
        if (e.button !== 0 || $(e.target).is(".drag")) {
            // Firefox emits right click events on the document, but not on
            // the child nodes, so the #compose stopPropagation doesn't get a
            // chance to capture right clicks.
            return;
        }

        // Dismiss popovers if the user has clicked outside them
        if ($('.popover-inner, .emoji-info-popover, .app-main [class^="column-"].expanded').has(e.target).length === 0) {
            popovers.hide_all();
        }

        if (compose_state.composing()) {
            if ($(e.target).is("a")) {
                // Refocus compose message text box if link is clicked
                $("#compose-textarea").focus();
            } else if (!$(e.target).closest(".overlay").length &&
            !window.getSelection().toString() &&
            !$(e.target).closest('.popover-content').length &&
            $(e.target).closest('body').length) {
                // Unfocus our compose area if we click out of it. Don't let exits out
                // of overlays or selecting text (for copy+paste) trigger cancelling.
                // Check if the click is within the body to prevent extensions from
                // interfering with the compose box.
                compose_actions.cancel();
            }
        }
    });

    // Workaround for Bootstrap issue #5900, which basically makes dropdowns
    // unclickable on mobile devices.
    // https://github.com/twitter/bootstrap/issues/5900
    $('a.dropdown-toggle, .dropdown-menu a').on('touchstart', function (e) {
        e.stopPropagation();
    });

    $("#settings_overlay_container .sidebar").on("click", "li[data-section]", function () {
        var $this = $(this);

        $("#settings_overlay_container .sidebar li").removeClass("active no-border");
        $this.addClass("active").prev().addClass("no-border");

        var $settings_overlay_container = $("#settings_overlay_container");
        $settings_overlay_container.find(".right").addClass("show");
        $settings_overlay_container.find(".settings-header.mobile").addClass("slide-left");

        settings.set_settings_header($(this).attr("data-section"));
    });

    $(".settings-header.mobile .icon-vector-chevron-left").on("click", function () {
        $("#settings_page").find(".right").removeClass("show");
        $(this).parent().removeClass("slide-left");
    });

    $("#settings_overlay_container .sidebar").on("click", "li[data-section]", function () {
        var $this = $(this);
        var section = $this.data("section");
        var sel = "[data-name='" + section + "']";

        $("#settings_overlay_container .sidebar li").removeClass("active no-border");
        $this.addClass("active");
        $this.prev().addClass("no-border");

        var is_org_section = $this.hasClass("admin");

        if (is_org_section) {
            window.location.hash = "organization/" + section;
        } else {
            window.location.hash = "settings/" + section;
        }

        $(".settings-section, .settings-wrapper").removeClass("show");

        ui.update_scrollbar($("#settings_content"));

        if (is_org_section) {
            admin_sections.load_admin_section(section);
        } else {
            settings_sections.load_settings_section(section);
        }

        $(".settings-section" + sel + ", .settings-wrapper" + sel).addClass("show");
    });

    (i18n.ensure_i18n(function () {
        var settings_toggle = components.toggle({
            name: "settings-toggle",
            values: [
                { label: i18n.t("Settings"), key: "settings" },
                { label: i18n.t("Organization"), key: "organization" },
            ],
            callback: function (name, key, payload) {
                $(".sidebar li").hide();

                if (key === "organization") {
                    $("li.admin").show();
                    if (!payload.dont_switch_tab) {
                        $("li[data-section='organization-profile']").click();
                    }
                } else {
                    $(".settings-list li:not(.admin)").show();
                    if (!payload.dont_switch_tab) {
                        $("li[data-section='your-account']").click();
                    }
                }
            },
        }).get();

        $("#settings_overlay_container .tab-container")
            .append(settings_toggle);
    }));
});

return exports;

}());

if (typeof module !== 'undefined') {
    module.exports = click_handlers;
}
