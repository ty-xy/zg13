var check = (function () {
    var exports = {};
    $("body").ready(function(){
       $(".notice_box").on("click",".common_check",function(e){
        $(".move_ctn").children().remove();
        console.log(11111,e)
        })
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = check;
}