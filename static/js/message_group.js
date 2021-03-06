var message_group = (function () {
    var exports = {};
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
            var url_index = url.substr(0,url.indexOf("/",i+1))
            if (url_index=== "#narrow/stream"){
                var hash = url.split("/")
                // var subject = hash_util.decodeHashComponent(hash[4])
                var stream = hash[2].split("-")
                var stream_id = stream[0]
                stream = hash_util.decodeHashComponent(stream[1])
                stream_id = Number(stream_id)
                $(".home-title span").html(stream) 
                $(".home-title").show()
                $(".home-title button").show();
                $(".compose-title").show()
            }else{
                $(".home-title").hide()
                $(".compose-title").hide()
            }
        }
        function alert(text,color){
            $('.toast-alerts-button').fadeIn({
                duration: 1
            }).delay (1000).fadeOut ({duration: 1000});
            $('.toast-alerts-button').html(text)
            $('.toast-alerts-button').css('background-color',color)
            }
        function  findPeople(data,item){
            var person = people.get_by_email(item);

            if (person) {
                var email = person.email.toLocaleLowerCase();
                var full_name = person.full_name.toLowerCase();

                return (email.indexOf(data) > -1 || full_name.indexOf(data) > -1);
            }
        }
        function  filter (list,data,func) {
             var vux =  list.filter(function (item) {
                  return func(data,item.email)
             })
             return vux
        }
        
        changeUrl()
        window.addEventListener('hashchange', function () {
                changeUrl()
                var hash = hashchange.parse_narrow(window.location.hash.split("/"))
                if(hash.length===2&&hash[0].operator==="stream"&&hash[1].operator==="subject"){
                    $("#stream").val(hash[0].operand)
                    $("#subject").val(hash[1].operand)
                }
          })
        function common(subscriptions,contents,shows){
            var content=  templates.render('show_group', {subscriptions:subscriptions,showList:shows});
            $("#group_seeting_choose").html(content)
            $("#group_seeting_choose .streams-list").height($(window).height()-160)
            $(contents).addClass("high_light_blue").siblings().removeClass("high_light_blue");
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
            // console.log(ul.length-5)
            if(i<ul.length-5){
                ul.eq(i).hide()
                i++
                if(i>0){
                   $(".first-icon i").css("color","#999")
                }
                if(i===ul.length-5){
                    $(".last-icon i").css("color","rgba(153,153,153,0.50)")
                    $(".last-icon i").attr("disabled",true);
                    // $(".first-icon i").removeAttr("disabled")
                    $(".first-icon i").css("color","#999")
                }else{
                    $(".last-icon i").removeAttr("disabled")
                    
                }
                
            }
        })
        $(".icon-prevs").on("click",function(e){
            var ul = $(".topic-list").children()
            if(i-1>-1){
             ul.eq(i-1).show()
             i--
             if(i<ul.length-5){
                $(".last-icon i").css("color","#999")
             }
             if(i===0){
                 $(".first-icon i").attr("disabled",true);
                 $(".last-icon i").removeAttr("disabled")
                 $(".last-icon i").css("color","#999")
                 $(".first-icon i").css("color","rgba(153,153,153,0.50)")
                }
            //  console.log(i,ul.length)
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
        //点击左边群组事件
        $(".persistent_data").off("a").on("click","a",function(e){
            var href = $(this).attr("href")
            if(href.indexOf("#narrow/stream")!==-1){
               var hash = href.split("/")
               var subject = hash_util.decodeHashComponent(hash[4])
               var stream = hash[2].split("-")
                stream = hash_util.decodeHashComponent(stream[1])
               $(".compose-content").show()
               $(".message_comp").show()
               $("#stream").val(stream)
               $("#subject").val(subject)
            }
        })
        //创建话题
        $(".make-stream-sure").on("click",function(e){
            var sub = $("#subjects").val()
            $("#subjects").val(sub.replace(/\s*/g,""))
            if($("#subjects").val().length>6){
                $('.err-text-topic').fadeIn({
                    duration: 1
                }).delay (1000).fadeOut ({duration: 1000});
            }else{
                opts = fill_in_opts_from_current_narrowed_view('stream', {trigger: 'new topic button'});
                compose_state.stream_name(opts.stream),
                compose_state.subject(opts.subject)
                var data = compose.create_message_object()
                data.type="stream";
                data.subject=compose_state.subjects();
                data.content="欢迎来到 "+data.subject+""
                compose.send_message(data)
                $("#subjects").val("")
                $(".compos-left-title span").show()
                var index = stream_data.get_stream_id(opts.stream)
                  $("#stream").val(opts.stream)
                  $("#subject").val(data.subject)
                  window.location.href="#narrow/stream/"+index+"-"+opts.stream+"/subject/"+data.subject+""
                $(".creare-topic-body").hide()
            }
  
        })
        //输入监控
        $("#subjects ").on("input",function(e){
            if($(this).val()!== ""){
                $(".make-stream-sure").removeAttr("disabled")
            }else{
                $(".make-stream-sure").attr("disabled",true);
            }
        })
        $(".group_icon").on("click",function(e){
            // people.get_person_from_user_id(26)
            $(this).addClass("backgr").next().next().children().removeClass("backgr")
            $(this).next().removeClass("backgr")
            $(".move_ctn").children().remove();
            $("#empty_narrow_all_mentioned").hide()
            $("#zhome").hide()
            $("#group_seeting_choose").show()
            $(".home-title").hide()
            $(".home_gruop_title").show()
            $("#main_div").show();
            // $("#home").show()
            var streams = stream_data.subscribed_subs();
            // console.log(streams)
            streams.forEach(function(value,i){
                value.count = unread.num_unread_for_stream(value.stream_id); 
            })
            // var sub = stream_data.get_subscribers()
            var subscriptions = stream_data.get_streams_for_settings_page();
            // console.log(stream_edit,323111)
            // 渲染群组
            var content1 =  templates.render('show_group', {subscriptions:streams,showList:false});
            $("#group_seeting_choose").html(content1)
        
            $("#group_seeting_choose .streams-list").height($(window).height()-160)
            $(".swtich-button").hide()
 
            $("#group_seeting_choose").off("click",".stream-list-rows").on("click",".stream-list-rows",function(){
                 e.preventDefault()
                 e.stopPropagation()
                var name =  $(this).attr("data-stream-name")
                var stream_id = $(this).attr("data-stream-id")
                var avatar = $(this).children().eq(0).css("background-color")
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
                        console.log(data)
                        var arr = JSON.parse(localStorage.getItem("arr"))
                        var subject
                        if(data.messages.length==0){
                            var stream = "stream"
                            var time = ''
                            var mes = ''
                             subject = compose.empty_topic_placeholder();
                            _href=narrow.by_stream_subject_uris(name,subject)
                            if(arr == null){
                                arr =[]
                                $(".persistent_data").show()
                                $(".persistent_data").prepend(templates.render("notice_box",{name:name,avatar:avatar,_href:_href,time:'',send_id:stream_id,mes:'',stream:stream}))
                                arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream))
                                localStorage.setItem("arr",JSON.stringify(arr))
                             }else{
                                 var flag = false;
                                 $(".persistent_data").show()
                                 for(var i =0;i<arr.length;i++){
                                     if(arr[i].stream_id == stream_id){
                                         flag = true;
                                         arr[i].content = arr[i].content
                                         localStorage.setItem("arr",JSON.stringify(arr))
                                     }
                                 }
                                 if(!flag){
                                     $(".persistent_data").show()
                                     $(".persistent_data").prepend(templates.render("notice_box",{name:name,avatar:avatar,_href:_href,time:time,send_id:stream_id,mes:server_events.deleteTag(mes),stream:stream}))
                                     arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream))
                                     localStorage.setItem("arr",JSON.stringify(arr))
                                 }
                             }
                             $("#stream").val(name)
                             $("#subject").val(subject)
                        }else{
                            var lastData = data.messages.pop()
                            var time = timerender.tf(lastData.timestamp)
                            _href=narrow.by_stream_subject_uris(name,lastData.subject)
                            var  mes  = lastData.content
                                 mes = server_events.deleteTag(mes)
                                //  console.log(lastData)
                            var stream = lastData.type
                            var arr = JSON.parse(localStorage.getItem("arr"))
                            if(arr == null){
                               arr =[]
                               $(".persistent_data").show()
                               $(".persistent_data").prepend(templates.render("notice_box",{name:name,avatar:avatar,_href:_href,time:time,send_id:stream_id,mes:mes,stream:stream}))
                               arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream))
                               localStorage.setItem("arr",JSON.stringify(arr))
                            }else{
                                var flag = false;
                                $(".persistent_data").show()
                                for(var i =0;i<arr.length;i++){
                                    if(arr[i].stream_id == stream_id){
                                        flag = true;
                                        arr[i].content = arr[i].content
                                        localStorage.setItem("arr",JSON.stringify(arr))
                                    }
                                }
                                if(!flag){
                                    console.log(1111)
                                    $(".persistent_data").show()
                                    $(".persistent_data").prepend(templates.render("notice_box",{name:name,avatar:avatar,_href:_href,time:time,send_id:stream_id,mes:server_events.deleteTag(mes),stream:stream}))
                                    arr.unshift(server_events.set_local_news('',stream_id,name,avatar,time,mes,_href,stream))
                                    localStorage.setItem("arr",JSON.stringify(arr))
                                }
                            }
                            subject = lastData.subject
                            // console.log(lastData)
                            $("#stream").val(name)
                            $("#subject").val(lastData.subject)
                        }
                        $(".notice_ctn_box").hide()
                        $(".group_icon").hide()
                        $(".home-title").show()
                        $(".home-title button").show();
                        $(".home-title span").text(name)
                        $(".home_gruop_title").hide()
                        $("#zfilt").show()
                        $("#stream-message").show()
                        $(".news_icon").addClass("left_blue_height");
                        $(".address_book").removeClass("left_blue_height")
                        i= 0
                        window.location.hash = narrow.by_stream_subject_uris(name,subject)
                        $(".only_tip[stream_id="+stream_id+"]").next().removeClass("backgr")
                        $(".only_tip[stream_id="+stream_id+"]").addClass("backgr")
                        i = 800
                        // function scrollToEnd(){//滚动到底部
                            var x = $("#zfilt").height()
                          
                        //    $('#zfilt').scrollIntoView()
                            i += 800
                            var h = 8000 + i;
                           
                        // }
                        if($(".topic-list").children().length===0){
                            $(".compos-left-title span").hide()
                        }else{
                            $(".compos-left-title span").show()
                        }
                        $("#compose").show()
                        $("#compose-container").show()
                        $(".compose-content").show()
                        $(".tab-content").scrollTop(h+x+$("#zfilt").offset().top);
                        $("#zfilt").scrollTop($("#zfilt").offset().top)
                        console.log($(".tab-content").scrollTop(),$("#zfilt").scrollTop())
                    }
                })
            })
            //点击左边的
            $(".column_two").on("click",".group_list_index",function(e){
                // 获得stream_id
                var stream_id = $(this).attr("data_stream_id")
                var sub = stream_data.get_sub_by_id(stream_id);
                $("#stream").val(sub.name)
                $("#subject").val(subject)
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
               //全部群组
              $("#group_seeting_choose").on("click",".all_group",function(){
                common(subscriptions,".all_group",true)
                $(".swtich-button").show()
                // 开关
                $(".streams-list").off().on("click","#div1",function(e){
                    e.stopPropagation()
                    e.preventDefault()
                    var stream_id = Number($(this).closest(".stream-list-row").attr("data-stream-id"))
                    var sub = stream_data.get_sub_by_id(stream_id)
                    subs.sub_or_unsub(sub);
                    var that = $(this)
                    $(this).attr("class",(that.attr("class")=="close1")?"open1":"close1")
                    $(this).children().attr("class",($(this).children().attr("class")=="close2")?"open2":"close2")
               })
              })
               //已订阅
              $("#group_seeting_choose").on("click",".already_sub",function(){
                var streams = stream_data.subscribed_subs();
                common(streams,".already_sub",false)
                     // 开关按钮暂定状态，稍后优化
                $(".swtich-button").hide()
            })
        })
        //群组设置
           $(".group_setting_icon").on("click",function(e){
            // e.preventDefault()
            //组织冒泡
            e.stopPropagation();
            var title = $(this).siblings().html()
            var titlef= title.slice(0,1)
            var text= $(".home-title span").html()
            
            var get_sub_by_name =stream_data.get_sub_by_name(title)
            console.log(get_sub_by_name,title,hash_util.decodeHashComponent(title))
            // var avatar = people.stream_url_for_eamil(emial[0])
            var avatars = []
            var emial =get_email_of_subscribers(get_sub_by_name.subscribers)
            // console.log(emial)
             emial.forEach(function(i,v){
                 var avatarUrl= people.stream_url_for_eamil(i.email)
                 var personnal = {
                    avatarUrl:avatarUrl,
                    name:i.index
                 }
                 avatars.push(personnal)
             })
             console.log(avatars)
             var show = emial.length>10?true:false
             var avatar= avatars.length>10?avatars.slice(0,10):avatars
          
            
            $(".group_setting").show()
            var url = '/json/users/me/' + get_sub_by_name.stream_id + '/topics';
            var peopleId = people.my_current_user_id()
            channel.get({
                url: url,
                data: {},
                success: function (data) {
                    var server_history = data.topics;
                    var names = [];
                    _.each(server_history, function (obj) {
                        var message = home_msg_list.get(obj.min_id)
                        if(message){
                            userid = message.sender_id
                            var subject = message.subject
                            if(userid===peopleId&&subject !="大厅"){
                                names.push(obj.name)
                            }
                        }
                    });
                    channel.get({
                        url:"/json/zg/stream/permissions",
                        data:{stream_id:get_sub_by_name.stream_id},
                        idempotent: true,
                        success:function(data){
                            if(data.errno===0){
                                var showTopic = names.length>2?true:false
                                var html = templates.render("group_setting",
                                {
                                    name:title,
                                    titlef:titlef,
                                    avatar:avatar,
                                    color:get_sub_by_name,
                                    show:show,
                                    showTopic:showTopic,
                                    topiclength:names.length,
                                    stream_permissions:data.stream_permissions,
                                    names:names.length>0?names.slice(0,2):''
                                })
                                $(".group_setting").html(html)
                                var colorpicker = $(".group_setting").find(".colorpicker")
                                var color = stream_data.get_color(title);
                                // console.log(color)
                                $(".up-chat").off("#div2").on("click","#div2",function(e){
                                    var that  =  $(this).parent()
                                    $(this).parent().attr("class",(that.attr("class")=="close1")?"open1":"close1")
                                    $(this).attr("class",($(this).attr("class")=="close2")?"open2":"close2")
                                })
                                $(".new-message-setting").off("#div2").on("click","#div2",function(e){
                                    var that  =  $(this).parent()
                                    $(this).parent().attr("class",(that.attr("class")=="close1")?"open1":"close1")
                                    $(this).attr("class",($(this).attr("class")=="close2")?"open2":"close2")
                                })
                                stream_color.set_colorpicker_colors(colorpicker, color);
                                $(".more-topic").on("click",function(e){
                                    e.stopPropagation()
                                    var html = templates.render("more_topic",{names:names})
                                    $(".names-item").html(html)
                                    $(".more-topic").hide()
                                })
                                $(".icon-search-email").on("click",function(e){
                                    $(".search-people-border").show()
                                    $(".seach-people-icon").hide()
                                    $(".search-people-border input").attr("placeholder","输入搜索内容")
                                    $(".search-people-border input").on("input",function(e){
                                       var data = filter(emial,$(this).val(),findPeople)
                                       if(data.length==0){
                                           $(".group_setting .list-avatar").empty()
                                           var li = "<li style='color:red,width:100%' class='choose-group-people'>没有这个成员<li>"
                                           $(".group_setting .list-avatar").html(li)
                                        }else{
                                            data.forEach(function(value){
                                                value.name = value.index,
                                                value.avatarUrl=people.stream_url_for_eamil(value.email)
                                            })
                                            var html = templates.render("more_people",{all_person:data})
                                            $(".group_setting .list-avatar").html(html)
                                        }
                                    })
                                })
                                $(".icon-add-people").on("click",function(e){
                                    // $(".search-people-border").show()
                                    $(".seach-people-icon").hide()
                                    $(".add-people-search").show()
                                    $(".add-subscriber-button").on("click",function(e){
                                        var settings_row = $(e.target).closest('.group-people-search');
                                        var text_box = settings_row.find('input[name="principal"]')
                                        var principal = $.trim(text_box.val());
                                        function success (data){
                                            text_box.val('');
                                            console.log(data)
                                            if (data.subscribed.hasOwnProperty(principal)) {
                                               alert("订阅群组成功","rgba(0,0,0,0.50)")
                                            } else {
                                                alert("该用户已订阅","rgba(0,0,0,0.50)")
                                            }
                                        }
                                        function invite_failure() {
                                            alert("订阅失败","rgba(255,0,0,0.63)")
                                        }
                                        if(principal==""){
                                            return
                                        }else{
                                            stream_edit.invite_user_to_stream(principal,get_sub_by_name,success,invite_failure)
                                        }    
                                    })
                                    // $(".search-people-border input").attr("placeholder","输入邮箱地址")
                               })
                               $(".icon-search-cancel").on("click",function(e){
                                    $(".search-people-border").hide()
                                    $(".add-people-search").hide()
                                    $(".seach-people-icon").show()
                                    var all_person = avatars
                                    var html = templates.render("more_people",{all_person:all_person})
                                    $(".group_setting .list-avatar").html(html)
                               })
                                $(".names-item").on("click",".topiclist-group",function(e){
                                   var  del_subject = $(this).attr("data-name")
                                   var that = $(this)
                                   var rendered = templates.render("feed_back_content",{deltag:true})
                                   $(".modal-logs").html(rendered)
                                   $(".modal-logs").show()
                                   $(".type-area>p").html("是否删除该话题？")
                                   $(".feadback-sure-del").on("click",function(e){
                                    $(".modal-logs").hide()
                                  
                                    channel.del({
                                        url: 'json/zg/subject/',
                                        idempotent: true,
                                        data:JSON.stringify({subject:del_subject,stream_id:get_sub_by_name.stream_id}),
                                        success:function(data){
                                            // topic_list.zoom_in()
                                            that.remove()
                                        }
                                    })
                                })
                              })
                            }
                        }
                    })
                },
            })
             
            $(".group_setting").off(".more-detail").on("click",".more-detail",function(e){
                e.stopPropagation()
                var all_person = avatars
                var html = templates.render("more_people",{all_person:all_person})
                $(".list-avatar").html(html)
            })
               
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
                            var arr = JSON.parse(localStorage.getItem("arr"))
                                for(var i=0;i<arr.length;i++){
                                    if(arr[i].stream_id == stream_id){
                                        arr.remove(i)
                                    }
                                }
                            localStorage.setItem("arr",JSON.stringify(arr))
                            $(".only_tip[stream_id ="+stream_id+"]").parent().remove()
                            $(window).attr("location","#narrow/is/starred")
                       },
                        error: function (xhr) {
                            ui_report.error(i18n.t("Error removing subscription"), xhr,
                                            $(".stream_change_property_info"));
                        },
                    });
                }
            })
            // 解散群组
            $(".group_setting").on("click",".back-tuiding-release",function(e){
                var stream_id = Number($(this).closest(".setting_body").attr("data-stream-id"))
                var sub = stream_data.get_sub_by_id(stream_id);
               // console.log(sub,"sub_es",e.target)
               var rendered = templates.render("feed_back_content",{deltag:true})
               $(".modal-logs").html(rendered)
               $(".modal-logs").show()
               $(".feadback-sure-del").on("click",function(e){
                   $(".modal-logs").hide()
                   if(sub){
                        channel.del({
                            url: '/json/streams/' + stream_id,
                            error: function (xhr) {
                                ui_report.error(i18n.t("Failed"), xhr, $('#organization-status'));
                            },
                            success: function (data) {
                                if(data.result==="success"){
                                    $(".group_setting").hide();                             
                                    // arr = JSON.parse(localStorage.getItem("arr"))
                                    // for(var i=0;i<arr.length;i++){
                                    //     if(arr[i].stream_id == stream_id){
                                    //         arr.remove(i)
                                    //     }
                                    // }
                                    // localStorage.setItem("arr",JSON.stringify(arr))

                                    // $(window).attr("location","#narrow/is/starred")
                                }
                            },
                        });
                    }
               })
            
           })
            //点击空白区域这个模态框消失
            if($(".group_setting").show()){
                   $(".group_setting").click(function(e){
                        $(this).show();
                        e.stopPropagation();//阻止冒泡
                   });
                    $("body").click(function(){
                        $(".group_setting").hide();
                    })
                    $(".recipient_row").click(function(e){
                        $(".group_setting").hide();
                    })
                    $(".compose-content").click(function(e){
                        $(".group_setting").hide();
                    })
                    $(".column_two").click(function(e){
                        $(".group_setting").hide();
                    })
             }
        })
    })
    
    
    return exports;
    
    }());
    if (typeof module !== 'undefined') {
        module.exports = message_group;
    }