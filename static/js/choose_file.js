var choose_file = (function () {
    var exports = {};
    // try_up.feature_check($("#compose #attach_files"));
    // upload_try.feature_check($("#file-choose #attach_file"));
    $("#file-choose").on("click", "#attach_files", function (e) {
        // e.preventDefault();
        $("#file-choose #file_inputs").trigger("click");
        console.log(4444)
    });
    // 2  // Click event binding for "Attach files" button
    // // Triggers a click on a hidden file input field
    // $("#compose").filedrop(
    //     try_up.options({
    //         mode: 'choose',
    //     })
    // );
    // $("#compose").on("click", "#attach_files", function (e) {
    //     e.preventDefault();
    //     $("#compose #file_input").trigger("click");
    // });
  
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = choose_file
}