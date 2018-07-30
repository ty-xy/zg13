var contact = (function(){
    var exports = {};
    $("body").ready(function(){
        console.log($(".contact"))
        $(".contact").on("click",function(){
            $(".notice_ctn_box").children().remove();
            $.ajax({
                url:"json/zg/user",
                type:"GET",
                success:function(res){
                    console.log(res)
                    var user_list = res.user_list;
                    var user_list_our = templates.render("user_list_our",{user_list:user_list})
                    $(".notice_ctn_box").append(user_list_our)
                    //点击联系人弹出右边页面
                    $(".notice_ctn_box").on("click",".user_list_box",function(){
                        var user_name = $(this).children().last().text();
                        var user_id = $(this).attr("user_id");
                        var email = $(this).attr("email");
                        console.log(user_name)
                        console.log(user_id)
                        console.log(email)
                    })
                }
            })
        })
    })
    
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}