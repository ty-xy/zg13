
var attendance = (function () {
    var exports = {};
    $("body").ready(function(){
        $(".common_img").on('click',function(){
            console.log($(this))
        })  
    })
    
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
