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
                }
            })
        })
    })
    
}())
if (typeof module !== 'undefined') {
    module.exports = contact;
}