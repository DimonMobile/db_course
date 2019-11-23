window.addEventListener('DOMContentLoaded', (event) => {
    let sendPostHref = document.getElementById('send-post');
    let subjectName = document.getElementById('subject-input');
    let content = document.getElementById('edit-textarea');

    console.log(sendPostHref);
    console.log(subjectName);
    console.log(content);

    sendPostHref.addEventListener('click', function (event) {
        sendPostHref.classList.add('disabled');
        M.toast({html: 'Uploading process started. Please wait...'});
        let formData = new FormData();
        formData.append('subject', subjectName.value);
        formData.append('content', content.value);
        let request = new XMLHttpRequest();

        request.addEventListener('load', function (event) {
            let resObject = JSON.parse(request.responseText)
            if (resObject.status == 'ok') {
                M.toast({html: 'Uploaded!'});
                window.location.href = '/profile/posts';
            } else {
                M.toast({html: `Uploading error, try again later<br>Error: ${resObject.error}`});
                sendPostHref.classList.remove('disabled');
            }
        });

        request.addEventListener('error', function (event) {
            M.toast({html: 'Network error'});
            sendPostHref.classList.remove('disabled');
        });

        request.open('POST', '/createPost');
        request.send(formData);
    });
});