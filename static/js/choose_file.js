var choose_file = (function () {
    var exports = {};
    // upload_try.feature_check($("#file-choose #attach_file"));
    $("#file-choose").on("click", "#attach_files", function (e) {
        e.preventDefault();
        $("#file-choose #file_inputs").trigger("click");
    });
    // $("#file-choose").filedrop(
    //     upload_try.options({
    //         mode:'choose'
    //     })
    // );
    return exports;
}());
if (typeof module !== 'undefined') {
    module.exports = choose_file
}