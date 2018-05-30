    var management = (function () {
    var exports = {};
    $(function () {
        $("#weekly").on("click",function(e){
            $("#management_ctn").append("<div>你好世界</div>")
        })
       
    });
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
