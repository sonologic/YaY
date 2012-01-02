$(function () {
    $('#fileupload').fileupload({
        dataType: 'json',
        url: 'upload/upload.php',
        autoUpload: false,
        done: function (e, data) {
            for(var i=0;i<data.result.length;i++) {
                
                console.log('processing');
                console.log(data.result[i]);
                if(data.result[i].error==0) {
                    editAudio(data.result[i]._id);
                } else {
                    alert('Error uploading file: ('+data.result[i].error+') '+data.result[i].msg);
                }
                
                
            }
        },
        progress: function(e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            Console.log(progress);
        }
    });
});