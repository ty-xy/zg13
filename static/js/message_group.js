var message_group = (function () {

    var exports = {};
    var iarr = []
    $(function(){
        function unique(a) {
            var res = [];
           
            for (var i = 0, len = a.length; i < len; i++) {
              var item = a[i];
           
              (res.indexOf(item) === -1) && res.push(item);
            }
           
            return res;
          }
          
        function  changeUrl (){
            var url =window.location.hash
            var i = url.indexOf("/")
            var index = url.indexOf("/",i+1)
            var url_index = url.substr(0,url.indexOf("/",i+1))
            var cindex = url.indexOf("-")
            if (url_index=== "#narrow/stream"){
                var stream_id = Number(url.slice(index+1,cindex))
                // var topic_names = topic_data.get_recent_names(stream_id);
                // console.log(topic_names,stream_id)
                common_topic(stream_id)
                if(url.indexOf("/",index+1) != -1){
                    var j = url.slice(index+4,url.indexOf("/",index+1))
                    j= decodeURI(j)
                    $(".home-title span").html(j)
                }else{
                    var title = decodeURI(url.substr(index+4))
                    $(".home-title span").html(title)             
                }
                $(".home-title").show()
                $(".compose-title").show()
            }else{
                $(".home-title").hide()
                $(".compose-title").hide()
            }
        }
        changeUrl()
        window.addEventListener('hashchange', function () {
                changeUrl()
          })
        
        // console.log(url.substr(0,url.lastIndexOf("/",1)))
        function common(subscriptions,contents){
            // if(contents===".all_group"){
            //     subscriptions.show_all=true
            // }else{
            //     subscriptions.show_all=false
            // }
            var content=  templates.render('show_group', {subscriptions:subscriptions});
            $("#group_seeting_choose").html(content)
            $(contents).addClass("high_light").siblings().removeClass("high_light");
        }
        function get_email_of_subscribers(subscribers){
            var emails = [];
            var subd=subscribers._items
            for(k in subd)
             {
                var email = people.get_person_from_user_id(subd[k].k).email;
                var index = people.get_person_from_user_id(subd[k].k).full_name;
                var person = {
                      email:email,
                      index:index
                }
                emails.push(person);
             }
            return emails;
        };
        function common_topic(index){
            var topic_names = topic_data.get_recent_names(index);
                    // if(topic_names.lenght===0){
                        topic_names.unshift("大厅")
                    // }
                    topic_names= unique(topic_names)
                    // var li = templates.render('topic_list', {topiclist:topic_names});
                    // $(".topic-list").html(li)
                    if(topic_names.length>5){
                        var i = 5
                        $(".icon-nexts").show()
                        $(".icon-prevs").show()
                        $(".icon-nexts").on("click",function(e){
                              if(i<topic_names.length){
                                ++ i
                                var topic_name = topic_names.slice(i-5,i)
                                li = templates.render('topic_list', {topiclist:topic_name})
                                $(".topic-list").html(li)
                                if(i>5){
                                    $(".icon-prevs i").css("color","#999999")
                                    $(".icon-prevs").on("click",function(e){
                                        if(i-5>0){
                                            --i
                                            var topic_name = topic_names.slice(i-5,i)
                                            li = templates.render('topic_list', {topiclist:topic_name})
                                            $(".topic-list").html(li)
                                        }
                                    })
                                }else{
                                    $(".icon-prevs i").css("color","rgba(153,153,153,0.50)")
                                }
                              }
                        })
                      
                    }else{
                        $(".icon-nexts").hide()
                        $(".icon-prevs").hide()
                        li = templates.render('topic_list', {topiclist:topic_names});
                        $(".topic-list").html(li)
                        $(".topic-list").on("click",".topic-item-list",function(e){
                            // debugger
                            e.stopPropagation()
                            e.preventDefault()
                             var topic= $.trim($(this).text())
                            $('#private-message').hide();
                            $('#stream-message').show();
                            var name = $.trim($(".home-title").children().eq(0).text())
                            var index = stream_data.get_stream_id (name)
                            // $("#stream_toggle").addClass("active");
                            // $("#private_message_toggle").removeClass("active");
                            $(window).attr("location","#narrow/stream/"+index+"-"+name+"/topic/"+topic+"")
                            $("#stream-message").show()
                            $("#stream").val(name)
                            $("#subject").val(topic)
                            compose_actions.respond_to_message({trigger: 'message click'});
                            $(this).addClass("backcolor").siblings().removeClass("backcolor")
                            // debugger
                        })
                    }
        }
        function fill_in_opts_from_current_narrowed_view(msg_type, opts) {
            var default_opts = {
                message_type:     msg_type,
                stream:           '',
                subject:          '',
                private_message_recipient: '',
                trigger:          'unknown',
            };
        
            // Set default parameters based on the current narrowed view.
            var compose_opts = narrow_state.set_compose_defaults();
            default_opts = _.extend(default_opts, compose_opts);
            opts = _.extend(default_opts, opts);
            return opts;
        }
        $(".create-topic").click(function(e){
             $(".creare-topic-body").toggle()
        })
        $(".make-stream-cancel").on("click",function(e){
            $(".creare-topic-body").hide()
            $("#subjects").val("")
        })
        $(".make-stream-sure").on("click",function(e){
            opts = fill_in_opts_from_current_narrowed_view('stream', {trigger: 'new topic button'});
            compose_state.stream_name(opts.stream),
            compose_state.subject(opts.subject)
            var data = compose.create_message_object()
            data.type="stream";
            data.subject=compose_state.subjects();
            data.content="欢迎来到 "+data.subject+""

            compose.send_message(data)
            $("#subjects").val("")
            var index = stream_data.get_stream_id (opts.stream)
              common_topic(index)
              $(window).attr("location","#narrow/stream/"+index+"-"+opts.stream+"/topic/"+data.subject+"")
            $(".creare-topic-body").hide()
        })
        $("#subjects ").on("input",function(e){
            if($(this).val()!== ""){
                $(".make-stream-sure").removeAttr("disabled")
            }else{
                $(".make-stream-sure").attr("disabled",true);
            }
        })
        $(".group_icon").on("click",function(e){
            // people.get_person_from_user_id(26)
            $(".move_ctn").hide()
            
            $("#empty_narrow_all_mentioned").hide()
            $("#zhome").hide()
            $("#group_seeting_choose").show()
            $(".home-title").hide()
            $(".home_gruop_title").show()
            $("#main_div").show();
            var streams = stream_data.subscribed_subs();
            var sub = stream_data.get_subscribers()
            var subscriptions = stream_data.get_streams_for_settings_page();
              
            // console.log(stream_edit,323111)
            // 渲染群组
           
            var content1 =  templates.render('show_group', {subscriptions:streams});
            $("#group_seeting_choose").html(content1)
            $(".swtich-button").hide()
              //已订阅的群组
            // $("#div1").on("click",function(e){
            //     e.preventDefault()
            //     e.stopPropagation()
            //     console.log(6)
            // 开关按钮暂定状态，稍后优化
                $("#group_seeting_choose").on("click","#div2",function(e){ 
                    if($(this).closest($(this).parent()).length!=0){
                        e.preventDefault()
                        e.stopPropagation()
                    var stream_id = Number($(this).closest(".stream-list-row").attr("data-stream-id"))
                    var sub = stream_data.get_sub_by_id(stream_id)
                    subs.sub_or_unsub(sub);
                    // var x = $(this).parents(".stream-list-row")
                    $(this).parent().attr("class",($(this).parent().attr("class")=="close1")?"open1":"close1")
                    $(this).attr("class",($(this).attr("class")=="close2")?"open2":"close2")
                  }
               })

            // })
            // 点击群组的事件
            $("#group_seeting_choose").on("click",".stream-row",function(){
                 e.preventDefault()
                 e.stopPropagation()
                var name =  $(this).attr("data-stream-name")
                var index = $(this).attr("data-stream-id")
                var color = $(this).children().eq(0).css("background-color")
                $("#compose").show()
                $("#compose-container").show()
                var nfirst= name.slice(0,1)
                var  li = "<li class='group_list_index' data_stream_id="+index+" >\
                             <span class='color-setting avatar_setting' style='background-color:"+color+"'>"+nfirst+"</span>\
                             <div class='list-setting-common'>\
                               <div class='list-right-setting'>\
                                  <span>"+name+"</span>\
                                  <span>12:15</span>\
                               </div>\
                               <p>请假申请发给你啦，通过一下…</p>\
                             </div>\
                           </li>"
                $(".notice_ctn_boxs").show()
                $(".notice_ctn_box").hide()
               
                $(".group_icon").hide()
                $(window).attr("location","#narrow/is/private")
                $(".home-title").show()
                if(iarr.indexOf(index)==-1){
                    iarr.push(index)
                   $(".notice_ctn_boxs").append(li)
                }
                $(".home-title span").html(name)
                $(".home_gruop_title").hide()
                $("#zfilt").hide()
               
                // $(".group_list_index").on("click",function(){
                    $(window).attr("location","#narrow/stream/"+index+"-"+name+"/topic/大厅")
                    $("#zfilt").show()
                    // $(".topic-list").children().eq(0).addClass("backcolor")
                    common_topic(index)
                    // console.log($(".topic-list").children().eq(0))
                    // $(".topic-list").children().eq(0).addClass("backcolor")
                    // $(".topic-list .topic-item-list")[0].addClass("backcolor")
                    $("#stream-message").show()
                    $("#stream").val(name)
                    $("#subject").val('大厅')
                    // compose_actions.respond_to_message({trigger: 'message click'});
                    // $(".topic-list").children().eq(0).addClass("backcolor")
              })
          
              //点击左边的
              $(".column_two").on("click",".group_list_index",function(e){
                // 获得stream_id
                var stream_id = $(this).attr("data_stream_id")
                // 获取群组的名字字
                var name = stream_data.maybe_get_stream_name(stream_id)
                var num_unread = unread.num_unread_for_topic(stream_id, "我爱中国");
                $(window).attr("location","#narrow/stream/"+stream_id+"-"+name+"")
              })
              //新建群组
              $("#group_seeting_choose").on("click",".new_setting",function(){
                    $("#new_steam_group").show()
                    var template = templates.render('new_group');
                    $("#new_steam_group").html(template)
                    var Height = $(window).height()
                    $(".stream_creation_body").height(Height-215)
                    // $("#stream-creation").height(Height-175)

                    $(".new_display_content").height(Height-60)
                    $(".new_display_content").on("click",function(e){
                        e.stopPropagation()
                        // e.preventDefault()
                    })
                   $(".icon-close-guanbi").on("click",function(e){
                       e.stopPropagation()
                       e.preventDefault()
                       $("#new_steam_group").hide()
                   })
                   stream_create.show_new_steam_modals()
                   // 当任何没有选中的时候，点击取消，模态框消失
                   $(".new_display_content").on("click","[data-dismiss]", function (e) {
                        e.preventDefault();
                        if (e.clientY !== 0) {
                            $("#new_steam_group").hide()
                        }
                   });
              })
              $("#new_steam_group").on("click",function(e){
                    // e.stopPropagation()
                    // e.preventDefault()
                    $(this).hide()
              })
             
            
              $("#group_seeting_choose").on("click",".all_group",function(){
                common(subscriptions,".all_group")
                $(".swtich-button").show()
              })
              //全部群组
              $("#group_seeting_choose").on("click",".already_sub",function(){
                var streams = stream_data.subscribed_subs();
                common(streams,".already_sub")
                $(".swtich-button").hide()
            })
        })
        
        $(".home-title").on("click","button",function(e){
            // e.preventDefault()
            //组织冒泡
            e.stopPropagation();
            var title = $(this).siblings().html()
            var titlef= title.slice(0,1)
            var text= $(".home-title span").html()
            var get_sub_by_name =stream_data.get_sub_by_name(title)
            var emial =get_email_of_subscribers(get_sub_by_name.subscribers)
            // var avatar = people.stream_url_for_eamil(emial[0])
            var avatar = []
             emial.forEach(function(i,v){
                 
                 var avatarUrl= people.stream_url_for_eamil(i.email)
                 var personnal = {
                    avatarUrl:avatarUrl,
                    name:i.index
                 }
                 avatar.push(personnal)
             })
            // console.log(title, $(this).siblings())
            var html = templates.render("group_setting",{name:title,titlef:titlef,avatar:avatar,color:get_sub_by_name})
            $(".group_setting").html(html)
            $(".group_setting").show()
             // 颜色的选择
             
            //  var colorpicker = $(".group_setting .sub_setting_color").children().eq(0);
            // $(".group_setting").on("click",".sub_setting_color",function(){
                var colorpicker = $(".group_setting").find(".colorpicker")
                var color = stream_data.get_color(title);
                stream_color.set_colorpicker_colors(colorpicker, color);
            // })
            // 退订群组
            $(".group_setting").on("click",".back-tuiding",function(e){
                 var stream_id = Number($(this).closest(".setting_body").attr("data-stream-id"))
                 var sub = stream_data.get_sub_by_id(stream_id);
                // console.log(sub,"sub_es",e.target)
                if(sub){
                    channel.del({
                        url: "/json/users/me/subscriptions",
                        data: {subscriptions: JSON.stringify([sub.name]) },
                        success: function () {
                            $(".group_setting").hide();
                            $(window).attr("location","#narrow/is/starred")
                            // $(".stream_change_property_info").hide();
                            // The rest of the work is done via the unsubscribe event we will get
                        },
                        error: function (xhr) {
                            ui_report.error(i18n.t("Error removing subscription"), xhr,
                                            $(".stream_change_property_info"));
                        },
                    });
                }
              
            })
            //点击空白区域这个模态框消失

            if($(".group_setting").show()){
                $('body').bind('click', function (e) {
                    var o = e.target;
                    if($(o).closest('.group_setting').length==0)//不是特定区域
                        $(".group_setting").hide();
                });
            }
        })
    })
    
    
    return exports;
    
    }());
    if (typeof module !== 'undefined') {
        module.exports = message_group;
    }