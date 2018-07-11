var management = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            var html = templates.render("attendance_box");
            $(".app").after(html);
        })

             
    });  
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
