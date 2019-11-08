let editTextarea;

function insertPicture(name, path) {
    editTextarea.value += `![${name}](${path})`;
}

function updatePreview() {
    let previewZone = document.getElementById("preview-zone");
    previewZone.innerHTML = markdown.toHTML(document.getElementById("edit-textarea").value);
    let images = previewZone.getElementsByTagName('img');
    for (let imageElement of images) {
        imageElement.classList.add('responsive-img');
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    let fileTag = document.getElementById('image-upload');
    let uploadBtn = document.getElementById('upload-btn');
    let imageUploadPreloader = document.getElementById('image-upload-preloader');
    let uploadCollection = document.getElementById('uploads-collection');
    editTextarea = document.getElementById('edit-textarea');

    function appendUploads(path, name) {
        let rootElement = document.createElement('li');
        rootElement.classList.add('collection-item');
        rootElement.classList.add('avatar');

        let imageElement = document.createElement('img');
        imageElement.classList.add('circle');
        imageElement.setAttribute('src', path);
        rootElement.appendChild(imageElement);

        let spanElement = document.createElement('span');
        spanElement.classList.add('title');

        let spanHrefElement = document.createElement('a');
        spanHrefElement.classList.add('truncate');
        spanHrefElement.setAttribute('href', '#');
        spanHrefElement.setAttribute('onclick', `insertPicture("${name}", "${path}");`);
        spanHrefElement.textContent = name;
        spanElement.appendChild(spanHrefElement);
        rootElement.appendChild(spanElement);

        let rootHrefElement = document.createElement('a');
        rootHrefElement.classList.add('secondary-content');
        rootHrefElement.setAttribute('href', '#');
        spanHrefElement.setAttribute('onclick', `insertPicture("${name}", "${path}");`);

        let iconElement = document.createElement('i');
        iconElement.classList.add('material-icons');
        iconElement.textContent = 'add_circle_outlined';
        rootHrefElement.appendChild(iconElement);

        rootElement.appendChild(rootHrefElement);

        uploadCollection.appendChild(rootElement);
    }


    function blockControls() {
        uploadBtn.classList.add('disabled');
        imageUploadPreloader.classList.remove('hide');
    }

    function releaseControls() {
        uploadBtn.classList.remove('disabled');
        imageUploadPreloader.classList.add('hide');
    }

    fileTag.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            let formData = new FormData();
            formData.append('image', this.files[0]);
            blockControls();

            let httpReq = new XMLHttpRequest();

            httpReq.addEventListener('load', function() {
                let obj = JSON.parse(httpReq.responseText);
                appendUploads(obj.path, obj.originalName);
                M.toast({html: 'Successfully loaded!'});
            });
        
            httpReq.addEventListener('error', function() {
                M.toast({html: 'Load error!'});
            });

            httpReq.addEventListener('loadend', function() {
                releaseControls();
            });

            httpReq.open('POST', '/upload');
            httpReq.send(formData);
        }
    });
});