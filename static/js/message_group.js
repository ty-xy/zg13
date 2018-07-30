var message_group = (function () {

    var exports = {};
    
    $(function(){
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