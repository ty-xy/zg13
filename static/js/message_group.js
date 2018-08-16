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
        //   console.log(window.location.hash.split(/\//))
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
                // common_topic(stream_id)
                if(url.indexOf("/",index+1) != -1){
                    var j = url.slice(index+4,url.indexOf("/",index+1))
                    j= hash_util.decodeHashComponent(j)
                    $(".home-title span").html(j)
                }else{
                    var title = hash_util.decodeHashComponent(url.substr(index+4))
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
        var hash = hashchange.parse_narrow(window.location.hash.split("/"))
        if(hash.length===2&&hash[0].operator==="stream"&&hash[1].operator==="subject"){
            $("#stream").val(hash[0].operand)
            $("#subject").val(hash[1].operand)
        }
        // console.log(url.substr(0,url.lastIndexOf("/",1)))
        function common(subscriptions,contents){
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
        // function common_topic(index){
       
        // }
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
        var i = 0 
        $("#compose .icon-nexts").on("click",function(e){
            var ul = $(".topic-list").children()
            if(0<i<ul.length-5){
                ul.eq(i).hide()
                i++
                if(i===ul.length-5){
                    $(".last-icon i").css("color","rgba(153,153,153,0.50)")
                    $(".last-icon i").attr("disabled",true);
                    // $(".first-icon i").removeAttr("disabled")
                    $(".first-icon i").css("color","#999")
                }else{
                    $(".last-icon i").removeAttr("disabled")
                }
                
            }
           
            console.log(i,ul.length)
        })
        $(".icon-prevs").on("click",function(e){
            var ul = $(".topic-list").children()
            if(i-1>-1){
             ul.eq(i-1).show()
             i--
             if(i===5){
                 $(".first-icon i").attr("disabled",true);
                 $(".last-icon i").removeAttr("disabled")
                 $(".last-icon i").css("color","#999")
                 $(".first-icon i").css("color","rgba(153,153,153,0.50)")
                }
             console.log(i,ul.length)
           }
        })         
        var Heights = $(window).height()
        $("#zfilt").height(Heights-350)
        //群组消息点
        $("#compose-container").on("click",".topic-list-item",function(e){
            
            $("#stream-message").show()
            var topic  = $(this).attr("data-topic-name")
            var stream =$(this).closest(".topic-list").attr("data-stream")
            $("#stream").val(stream)
            $("#subject").val(topic)
            compose_actions.respond_to_message({trigger: 'message click'});
            // var topic= $.trim($(this).text())
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
            //   common_topic(index)
              $("#stream").val(opts.stream)
              $("#subject").val(data.subject)
              window.location.href="#narrow/stream/"+index+"-"+opts.stream+"/subject/"+data.subject+""
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
            $("#group_seeting_choose .stream-row").on("click",function(){
                 e.preventDefault()
                 e.stopPropagation()
                var name =  $(this).attr("data-stream-name")
                var index = $(this).attr("data-stream-id")
                var color = $(this).children().eq(0).css("background-color")
                $("#compose").show()
                $("#compose-container").show()
                var nfirst= name.slice(0,1)
              
                var data = {
                        anchor: 773,
                        num_before: 50,
                        num_after: 50,
                        narrow:JSON.stringify([{"negated":false,"operator":"stream","operand":name}])
                    };
                channel.get({
                    url:  '/json/messages',
                    data: data,
                    idempotent: true,
                    success:function(data){ 
                        var lastData = data.messages.pop()
                        console.log(lastData)
                        var time = timerender.tf(lastData.timestamp)
                        // console.log($(".group_list_index").find(".backgr"))
                        // $(".group_list_index").find(".backgr").removeClass("backgr")
                        var show = $(".persistent_data").children().find(".backgr")
                        if(show.prevObject.length>0){
                             show.prevObject.removeClass("backgr")
                        }
                        var  li = "<li class='group_list_index backgr' data_stream_id="+lastData.stream_id+" >\
                             <span class='color-setting avatar_setting' style='background-color:"+color+"'>"+nfirst+"</span>\
                             <div class='list-setting-common'>\
                               <div class='list-right-setting'>\
                                  <span>"+name+"</span>\
                                  <span>"+time+"</span>\
                               </div>\
                               "+lastData.content+"\
                             </div>\
                           </li>"
                        // $(".notice_ctn_boxs").show()
                        $(".persistent_data").show()
                        $(".notice_ctn_box").hide()
                        $(".group_icon").hide()
                        // $(window).attr("location","#narrow/is/private")
                        $(".home-title").show()
                        if(iarr.indexOf(index)==-1){
                            iarr.push(index)
                        $(".persistent_data").append(li)
                        // $(".notice_ctn_boxs").append(li)
                        }

                        $(".home-title span").html(name)
                        $(".home_gruop_title").hide()
                        $("#zfilt").hide()
                        window.location.hash = narrow.by_stream_subject_uri(name,lastData.subject)
                        // $(window).attr("location","#narrow/stream/"+index+"-"+name+"/topic/大厅")
                        $("#zfilt").show()
                        // common_topic(index)
                        $("#stream-message").show()
                        $("#stream").val(name)
                        $("#subject").val(lastData.subject)
                        i= 0
                    }
                })
            })
            //点击左边的
            $(".column_two").on("click",".group_list_index",function(e){
                // 获得stream_id
                var stream_id = $(this).attr("data_stream_id")
                var sub = stream_data.get_sub_by_id(stream_id);
                $(this).addClass("backgr").siblings().removeClass("backgr")
                var data = {
                    anchor: 773,
                    num_before: 50,
                    num_after: 50,
                    narrow:JSON.stringify([{"negated":false,"operator":"stream","operand":sub.name}])
                };
                channel.get({
                    url:  '/json/messages',
                    data: data,
                    idempotent: true,
                    success:function(data){
                        var subject =  data.messages.pop().subject
                        $("#stream").val(sub.name)
                        $("#subject").val(subject)
                         window.location.href=narrow.by_stream_subject_uri(sub.name,subject)
                    }
                }) 
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
            var avatars = []
             emial.forEach(function(i,v){
                 
                 var avatarUrl= people.stream_url_for_eamil(i.email)
                 var personnal = {
                    avatarUrl:avatarUrl,
                    name:i.index
                 }
                 avatars.push(personnal)
             })
             var show = emial.length>10?true:false
             var avatar= avatars.length>10?avatars.slice(0,10):avatars
            var html = templates.render("group_setting",
                                        {name:title,
                                        titlef:titlef,
                                        avatar:avatar,
                                        color:get_sub_by_name,
                                        show:show})
            $(".group_setting").html(html)
            $(".group_setting").show()
             // 颜色的选择
            $(".more-detail").on("click",function(e){
                e.stopPropagation()
                var all_person = avatars
                var html = templates.render("more_people",{all_person:all_person})
                $(".list-avatar").html(html)
            })
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