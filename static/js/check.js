var check = (function () {
    var exports = {};
    $("body").ready(function(){
       $(".notice_box").on("click",".common_check",function(e){
            $(this).addClass("backgr").siblings().removeClass("backgr")
            $(".move_ctn").children().remove();
            var li = templates.render("tab")
            $(".move_ctn").html(li)
            
        })
        //请假
        $(".move_ctn").on("click",".ask_for_leave",function(e){
            $(".move_ctn").children().remove();
            var li = templates.render("ask-for-leave")
            $(".move_ctn").html(li)
        })
    //     $("#form-test").bootstrapValidator({
    //         live: 'enabled',//验证时机，enabled是内容有变化就验证（默认），disabled和submitted是提交再验证
    //         excluded: [':disabled', ':hidden', ':not(:visible)'],//排除无需验证的控件，比如被禁用的或者被隐藏的
    //         submitButtons: '#btn-test',//指定提交按钮，如果验证失败则变成disabled，但我没试成功，反而加了这句话非submit按钮也会提交到action指定页面
    //         message: '通用的验证失败消息',//好像从来没出现过
    //         feedbackIcons: {//根据验证结果显示的各种图标
    //             valid: 'glyphicon glyphicon-ok',
    //             invalid: 'glyphicon glyphicon-remove',
    //             validating: 'glyphicon glyphicon-refresh'
    //         },
    //         fields: {
    //             email: {
    //                 validators: {
    //                     emailAddress: {//验证email地址
    //                         message: '不是正确的email地址'
    //                     },
    //                     notEmpty: {//检测非空
    //                         message: '请输入邮箱'
    //                     },
    //                 }
    //             },
    //             password: {
    //                 validators: {
    //                     notEmpty: {//检测非空
    //                         message: '请输入密码'
    //                     },
    //                 }
    //             },
    //             repassword: {
    //                 validators: {
    //                     notEmpty: {//检测非空
    //                         message: '请输入确认密码'
    //                     },
    //                     identical: {//与指定控件内容比较是否相同，比如两次密码不一致
    //                         field: 'password',//指定控件name
    //                         message: '两次输入的密码不同'
    //                     },
    //                 }
    //             },
    //             username: {
    //                 validators: {
    //                     notEmpty: {//检测非空,radio也可用
    //                         message: '请输入用户名'
    //                     },
    //                     stringLength: {//检测长度
    //                         min: 3,
    //                         max: 10,
    //                         message: '长度必须在3-10之间'
    //                     },
    //                     regexp: {//正则验证
    //                         regexp: /^[a-zA-Z0-9_\.]+$/,
    //                         message: '所输入的字符不符要求'
    //                     },
    //                 }
    //             }
    //         }
    //     });
 
    //     function showToast(msg,shortCutFunction)
    //     {
    //         toastr.options = {
    //             "closeButton": true,
    //             "debug": false,
    //             "progressBar": true,
    //             "positionClass": "toast-bottom-right",
    //             "onclick": null,
    //             "showDuration": "400",
    //             "hideDuration": "1000",
    //             "timeOut": "7000",
    //             "extendedTimeOut": "1000",
    //             "showEasing": "swing",
    //             "hideEasing": "linear",
    //             "showMethod": "fadeIn",
    //             "hideMethod": "fadeOut"
    //         }
    //         toastr[shortCutFunction](msg,"提示");
    //     }
 
    //     $("#btn-test").click(function () {//非submit按钮点击后进行验证，如果是submit则无需此句直接验证
    //         $("#form-test").bootstrapValidator('validate');//提交验证
    //         if ($("#form-test").data('bootstrapValidator').isValid()) {//获取验证结果，如果成功，执行下面代码
    //             showToast("2345678","error");
    //             alert("yes");//验证成功后的操作，如ajax
    //         }
    //     });
    })
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = check;
}