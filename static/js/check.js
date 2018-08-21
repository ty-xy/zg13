var check = (function () {
    var exports = {};
    $("body").ready(function(){
       $(".notice_box").on("click",".common_check",function(e){
            $(this).addClass("backgr").siblings().removeClass("backgr")
            $(".move_ctn").children().remove();
            var li = templates.render("tab")
            $(".move_ctn").html(li)
        })
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = check;
}