var message_group = (function () {

    var exports = {};
    
    $(function(){
        function common(subscriptions,contents){
            var content=  templates.render('show_group', {subscriptions:subscriptions});
            $("#group_seeting_choose").html(content)
            $(contents).addClass("high_light").siblings().removeClass("high_light");
        }
        $(".group_icon").on("click",function(e){
            $("#empty_narrow_all_mentioned").hide()
            $("#zhome").hide()
              $("#group_seeting_choose").show()
              $(".home-title").hide()
              $(".home_gruop_title").show()
               var streams = stream_data.subscribed_subs();
               var subscriptions = stream_data.get_streams_for_settings_page();
               var content1 =  templates.render('show_group', {subscriptions:streams});
              $("#group_seeting_choose").html(content1)
              //已订阅的群组
              $(".all_group").on("click",function(){
                  common(subscriptions,".all_group")
              })
              //全部群组
              $(".already_sub").on("click",function(){
                 common(streams,".already_sub")
            })
        })
        $(".home-title").on("click","button",function(e){
            // e.preventDefault()
            //组织冒泡
            e.stopPropagation();
            var title = $(this).siblings().html()
            var text= $(".home-title span").html()
            console.log(title, $(this).siblings())
            var html = templates.render("group_setting",{name:title})
            $(".group_setting").html(html)
            $(".group_setting").show()

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