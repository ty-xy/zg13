var attendance = (function () {
    var exports = {};
  
    $("body").ready(function () {
        
        $(".common_img").on("click",function(){
            var html = templates.render("attendance_box");
            $(".app").after(html);
            $(".attendance_md").on("click",".attendance_close",function(){
                $(".attendance_md").remove()
           })
           //点击考勤组的样式
        })
      
             
    });  
    return exports;
    }());
    if (typeof module !== 'undefined') {
        module.exports = attendance;
    }
    
