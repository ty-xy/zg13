    var management = (function () {
    var exports = {};
    $(function () {
        //点击打开周报
        $("#weekly").on("click",function(e){
            var zjson={
                d1:"这是一个秋天",
                d2:"风儿那么缠绵"
            }
            $(".management_siber").html("<div>"+zjson.d1+zjson.d2+"</div>")
            $.ajax({
                type:"",
                url:"",
                success:function(data){

                }
            })
            $(".management_set").show();
        })
        //点击关闭
        $(".close_management_set").on("click",function(){
            $(".management_set").fadeOut();
        })
        //拖拽效果
        $(".management_set").on("mousedown",function(e){
            var x =parseInt(e.pageX - $(".management_set").offset().left);
            var y =parseInt(e.pageY - $(".management_set").offset().top); 
            $(".management_set").bind("mousemove",function(ev){
                var ox = ev.pageX - x;
                var oy = ev.pageY-y;
                $(".management_set").css({
                    left:ox+"px",
                    top:oy+"px"
                })
            })
            $(".management_set").on("mouseup",function(e){
                $(this).unbind("mousemove");
            })
        })
    });
    return exports;
    }());
    
    if (typeof module !== 'undefined') {
        module.exports = management ;
    }
